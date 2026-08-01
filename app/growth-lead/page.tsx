"use client";

import { useState } from "react";
import { chat as apiChat } from "@/lib/api";
import { CREATOR, REVIEW, THREADS } from "@/lib/mock";
import type { ChatMessage } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, SectionHeading } from "@/components/ui";

export default function GrowthLeadPage() {
  const toast = useToast();
  const [threadId, setThreadId] = useState(THREADS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(THREADS[0].messages);
  const [input, setInput] = useState("");
  const [moves, setMoves] = useState(REVIEW.moves);

  const thread = THREADS.find((t) => t.id === threadId)!;

  function openThread(id: string) {
    setThreadId(id);
    setMessages(THREADS.find((t) => t.id === id)!.messages);
  }

  const [thinking, setThinking] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    const now = new Date().toISOString();
    setMessages((ms) => [...ms, { id: `u-${now}`, role: "user", text, at: now }]);
    setThinking(true);
    let reply: string;
    try {
      const res = await apiChat({
        message: text,
        history: messages.slice(-10).map((m) => ({ role: m.role, content: m.text })),
        profile: CREATOR.ipProfile,
      });
      reply = res.reply;
    } catch {
      // Offline → the M1 sample experience stands.
      reply =
        "I'm offline right now, so this is sample data. When the backend is reachable I answer grounded in your IP profile — and never invent your stories.";
    }
    setThinking(false);
    const at = new Date().toISOString();
    setMessages((ms) => [...ms, { id: `a-${at}`, role: "assistant", text: reply, at }]);
  }

  function decideMove(id: string, status: "accepted" | "declined") {
    setMoves((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)));
    toast(
      status === "accepted" ? "success" : "info",
      status === "accepted"
        ? "Accepted — this move amends your IP profile (new version)."
        : "Declined — noted for the next review."
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Growth Lead"
        sub="Chat, goals, and reviews — grounded in your IP, your Library, and what actually worked."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Chat */}
        <Card className="flex min-h-[420px] flex-col">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-hairline pb-3">
            <span className="text-sm font-semibold">{thread.title}</span>
            <button
              onClick={() => toast("info", "New threads arrive with the backend at Milestone 3.")}
              className="btn-ghost px-3 py-1 text-xs"
            >
              New thread
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] animate-[msg-in_.15s_ease-out] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "self-end bg-accent/15 text-ink"
                    : "self-start bg-surface-2 text-ink-2"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                <p className="mt-1 text-right text-[10px] text-ink-muted">
                  {fmtTime(m.at)}
                </p>
              </div>
            ))}
            {thinking && (
              <div className="max-w-[85%] animate-[msg-in_.15s_ease-out] self-start rounded-2xl bg-surface-2 px-4 py-2.5 text-sm text-ink-muted">
                Thinking…
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder='Try "plan my week" — the run lands in this thread'
              className="flex-1 rounded-full border border-hairline bg-page px-4 py-2 text-sm text-ink placeholder:text-ink-muted"
            />
            <button onClick={send} className="btn-primary px-4 py-2 text-sm">
              Send
            </button>
          </div>
        </Card>

        {/* Right rail */}
        <div className="flex flex-col gap-5">
          <Card title="Goals">
            <ul className="flex flex-col gap-2.5">
              {CREATOR.ipProfile.goals.map((g, i) => (
                <li key={i} className="rounded-xl bg-surface-2 px-3.5 py-2.5">
                  <p className="text-sm text-ink-2">{g.statement}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{g.horizon}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Latest growth review"
            action={<span className="text-xs text-ink-muted">{fmtDate(REVIEW.at)}</span>}
          >
            <p className="text-xs leading-relaxed text-ink-2">{REVIEW.summary}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {moves.map((m) => (
                <li key={m.id} className="rounded-xl bg-surface-2 p-3">
                  <p className="text-xs font-semibold">{m.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                    {m.rationale}
                  </p>
                  {m.status === "proposed" ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => decideMove(m.id, "accepted")}
                        className="btn-primary px-3 py-1 text-[11px]"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => decideMove(m.id, "declined")}
                        className="btn-ghost px-3 py-1 text-[11px]"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <p
                      className={`mt-2 text-[11px] font-medium ${
                        m.status === "accepted" ? "text-good" : "text-ink-muted"
                      }`}
                    >
                      {m.status === "accepted"
                        ? "Accepted → profile amended"
                        : "Declined"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Threads">
            <ul className="flex flex-col gap-1">
              {THREADS.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => openThread(t.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      t.id === threadId
                        ? "bg-wash-2 font-medium text-ink"
                        : "text-ink-2 hover:bg-wash"
                    }`}
                  >
                    <span className="block truncate">{t.title}</span>
                    <span className="text-[10px] text-ink-muted">
                      {fmtDate(t.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
