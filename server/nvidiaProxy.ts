/* =====================================================================
   nvidiaProxy.ts — serves /api/llm (see server/app.ts for where it runs).

   The browser never sees the NVIDIA API key. It sends chat messages to
   this local endpoint; the dev (or preview) server adds the key from
   NVIDIA_API_KEY in .env and forwards the call to NVIDIA's
   OpenAI-compatible endpoint. Doing it server-side also sidesteps CORS,
   which NVIDIA's API does not allow from browsers.
   ===================================================================== */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";
import { readBody } from "./http.js";

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const MAX_BODY_BYTES = 64 * 1024;

export interface ProxyOptions {
  apiKey: string | undefined;
  model: string | undefined;
  /** "on" lets reasoning models think before answering (slower). */
  thinking?: string | undefined;
  /** When set, only signed-in users may call the model, so nobody else
   *  can spend your NVIDIA quota. */
  isSignedIn?: (req: IncomingMessage) => boolean;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function isMessages(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (m) =>
        m !== null &&
        typeof m === "object" &&
        ["system", "user", "assistant"].includes((m as ChatMessage).role) &&
        typeof (m as ChatMessage).content === "string",
    )
  );
}

export function nvidiaMiddleware({ apiKey, model, thinking: thinkingEnv, isSignedIn }: ProxyOptions): Connect.NextHandleFunction {
  const thinking = thinkingEnv?.toLowerCase() === "on";
  return (req, res, next) => {
    if (!req.url?.startsWith("/api/llm")) return next();

    if (req.method === "GET") {
      // Lets the UI say "add your key" before the user writes an answer.
      send(res, 200, { configured: Boolean(apiKey), model: model || DEFAULT_MODEL });
      return;
    }
    if (req.method !== "POST") {
      send(res, 405, { error: "Method not allowed" });
      return;
    }
    if (isSignedIn && !isSignedIn(req)) {
      send(res, 401, { error: "not_signed_in" });
      return;
    }
    if (!apiKey) {
      send(res, 503, { error: "missing_key" });
      return;
    }

    void (async () => {
      try {
        const parsed = JSON.parse(await readBody(req, MAX_BODY_BYTES)) as {
          messages?: unknown;
          temperature?: unknown;
          maxTokens?: unknown;
        };
        if (!isMessages(parsed.messages)) {
          send(res, 400, { error: "Expected a non-empty messages array" });
          return;
        }
        const temperature =
          typeof parsed.temperature === "number" ? Math.min(Math.max(parsed.temperature, 0), 1) : 0.6;
        const maxTokens =
          typeof parsed.maxTokens === "number" ? Math.min(Math.max(parsed.maxTokens, 64), 4096) : 1500;

        /* Reasoning models (Nemotron 3, etc.) "think" first, and that hidden
           reasoning counts against max_tokens. On hard questions it used the
           whole budget and left the visible reply empty. Writing and grading
           an interview question does not need it, so it is switched off; set
           NVIDIA_THINKING=on in .env to allow it. */
        const call = (withThinkingFlag: boolean): Promise<Response> =>
          fetch(NVIDIA_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              model: model || DEFAULT_MODEL,
              messages: parsed.messages,
              temperature,
              top_p: 0.9,
              max_tokens: maxTokens,
              stream: false,
              ...(withThinkingFlag ? { chat_template_kwargs: { enable_thinking: thinking } } : {}),
            }),
            signal: AbortSignal.timeout(120_000),
          });

        let upstream = await call(true);
        // A model that does not know the flag may reject it; retry plain once.
        if (upstream.status === 400 || upstream.status === 422) upstream = await call(false);

        const text = await upstream.text();
        if (upstream.status === 401 || upstream.status === 403) {
          send(res, 401, {
            error: "NVIDIA rejected the API key. Copy it again from build.nvidia.com into NVIDIA_API_KEY in study/.env, save, then click Start again.",
          });
          return;
        }
        if (!upstream.ok) {
          send(res, upstream.status, { error: `NVIDIA API ${upstream.status}: ${text.slice(0, 300)}` });
          return;
        }
        const data = JSON.parse(text) as {
          choices?: { message?: { content?: string | null }; finish_reason?: string }[];
        };
        const choice = data.choices?.[0];
        const content = choice?.message?.content ?? "";
        if (!content.trim()) {
          send(res, 502, {
            error:
              choice?.finish_reason === "length"
                ? "The model ran out of room before answering. Try again, or pick a different NVIDIA_MODEL."
                : "The model sent back an empty reply. Try again.",
          });
          return;
        }
        send(res, 200, { content });
      } catch (err) {
        send(res, 502, { error: err instanceof Error ? err.message : "LLM request failed" });
      }
    })();
  };
}
