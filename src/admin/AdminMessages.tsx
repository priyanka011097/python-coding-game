/* Contact-form messages, newest first, on the Admin page. */

import { useEffect, useState } from "react";

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  userId: string | null;
}

export function AdminMessages() {
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; error: string } | { status: "ready"; messages: Message[]; stored: boolean }
  >({ status: "loading" });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/messages", { cache: "no-store" });
        const body = (await res.json()) as { messages?: Message[]; stored?: boolean; error?: string };
        if (!res.ok || !body.messages) setState({ status: "error", error: body.error ?? `Could not load messages (${res.status}).` });
        else setState({ status: "ready", messages: body.messages, stored: body.stored ?? false });
      } catch {
        setState({ status: "error", error: "Could not reach the server." });
      }
    })();
  }, []);

  return (
    <section className="ad-messages">
      <h2>
        Messages{state.status === "ready" && <span className="ad-muted"> · {state.messages.length}</span>}
      </h2>
      {state.status === "loading" && <p className="ad-muted">Loading…</p>}
      {state.status === "error" && <p className="ad-error">{state.error}</p>}
      {state.status === "ready" &&
        (state.messages.length === 0 ? (
          <p className="ad-muted">No messages yet. They arrive from the Contact page.</p>
        ) : (
          <ul>
            {state.messages.map((m) => (
              <li key={m.id}>
                <div className="ad-msg__head">
                  <b>{m.name}</b>
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to HyperTransformer AI")}`}>{m.email}</a>
                  {m.userId && <span className="ad-msg__tag">signed in</span>}
                  <span className="ad-muted">
                    {new Date(m.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                <p>{m.message}</p>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
