/* =====================================================================
   nvidiaProxy.ts — a Vite plugin that serves POST /api/llm.

   The browser never sees the NVIDIA API key. It sends chat messages to
   this local endpoint; the dev (or preview) server adds the key from
   NVIDIA_API_KEY in .env.local and forwards the call to NVIDIA's
   OpenAI-compatible endpoint. Doing it server-side also sidesteps CORS,
   which NVIDIA's API does not allow from browsers.
   ===================================================================== */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const MAX_BODY_BYTES = 64 * 1024;

interface ProxyOptions {
  apiKey: string | undefined;
  model: string | undefined;
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

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
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

function middleware({ apiKey, model }: ProxyOptions): Connect.NextHandleFunction {
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
    if (!apiKey) {
      send(res, 503, { error: "missing_key" });
      return;
    }

    void (async () => {
      try {
        const parsed = JSON.parse(await readBody(req)) as {
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
          typeof parsed.maxTokens === "number" ? Math.min(Math.max(parsed.maxTokens, 64), 2048) : 1024;

        const upstream = await fetch(NVIDIA_URL, {
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
          }),
          signal: AbortSignal.timeout(90_000),
        });

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
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content ?? "";
        send(res, 200, { content });
      } catch (err) {
        send(res, 502, { error: err instanceof Error ? err.message : "LLM request failed" });
      }
    })();
  };
}

export function nvidiaProxy(options: ProxyOptions): Plugin {
  return {
    name: "nvidia-llm-proxy",
    configureServer(server) {
      server.middlewares.use(middleware(options));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(options));
    },
  };
}
