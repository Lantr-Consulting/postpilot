"use client";

import { useEffect, useState } from "react";
import {
  chat as apiChat,
  decideMove,
  getReviews,
  getThreadMessages,
  getThreads,
  pollRun,
  runReview,
  type Review,
} from "@/lib/api";
import { useMe } from "@/lib/use-me";
import { CREATOR, REVIEW, THREADS } from "@/lib/mock.en";
import type { ChatMessage } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, SectionHeading } from "@/components/ui";

interface ThreadStub {
  id: string;
  title: string;
  updatedAt: string;
}

export default function GrowthLeadPage() {
  const toast = useToast();
  const { me, refresh: refreshMe } = useMe();
  const signedIn = me !== null;

  // Growth reviews — live when signed in, the mock review otherwise.
  const [liveReviews, setLiveReviews] = useState<Review[] | null>(null);
  const [reviewing, setReviewing] = useState(false);
  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    getReviews().then((rs) => alive && setLiveReviews(rs)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [signedIn]);

  const [reviewProgress, setReviewProgress] = useState("");

  async function startReview() {
    if (!signedIn) {
      toast("info", "Sign in to run a real review — this is sample data.");
      return;
    }
    setReviewing(true);
    try {
      const run = await runReview();
      const done = await pollRun(run.id, (r) => setReviewProgress(r.progress || "Working…"));
      if (done.status === "done") {
        setLiveReviews(await getReviews());
        toast("success", "Review done — decide on its moves below.");
      } else {
        toast("error", done.report ?? "Review failed — try again.");
      }
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Review failed — try again.");
    }
    setReviewing(false);
    setReviewProgress("");
  }

  async function decideLiveMove(review: Review, index: number, accept: boolean) {
    try {
      const updated = await decideMove(review.id, index, accept);
      setLiveReviews((rs) => (rs ?? []).map((r) => (r.id === updated.id ? updated : r)));
      if (accept) {
        await refreshMe(); // the lesson amended the brand book (new version)
        toast("success", "Accepted — written into your brand book as a standing lesson.");
      } else {
        toast("info", "Declined — noted.");
      }
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Couldn't save that decision.");
    }
  }

  const [threadId, setThreadId] = useState<string | null>(THREADS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(THREADS[0].messages);
  const [liveThreads, setLiveThreads] = useState<ThreadStub[] | null>(null);
  const [input, setInput] = useState("");
  const [moves, setMoves] = useState(REVIEW.moves);

  // Signed in: real threads from Supabase replace the mock ones.
  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    getThreads()
      .then((ts) => {
        if (!alive) return;
        setLiveThreads(ts);
        if (ts.length) {
          setThreadId(ts[0].id);
          getThreadMessages(ts[0].id).then((ms) => alive && setMessages(ms));
        } else {
          setThreadId(null);
          setMessages([]);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [signedIn]);

  const threads: ThreadStub[] = liveThreads ?? THREADS;
  const thread = threads.find((t) => t.id === threadId);

  function openThread(id: string) {
    setThreadId(id);
    if (liveThreads) {
      getThreadMessages(id).then(setMessages).catch(() => {});
    } else {
      setMessages(THREADS.find((t) => t.id === id)!.messages);
    }
  }

  function newThread() {
    if (!signedIn) {
      toast("info", "Sign in to keep threads — this is sample data.");
      return;
    }
    setThreadId(null);
    setMessages([]);
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
        // Signed in, the server uses the saved brand book; the mock profile
        // only grounds the signed-out demo.
        profile: signedIn ? undefined : CREATOR.ipProfile,
        threadId: signedIn ? threadId : undefined,
      });
      reply = res.reply;
      if (signedIn && res.threadId && res.threadId !== threadId) {
        setThreadId(res.threadId);
        getThreads().then(setLiveThreads).catch(() => {});
      }
    } catch {
      // Offline → the M1 sample experience stands.
      reply =
        "I'm offline right now, so this is sample data. When the backend is reachable I answer grounded in your IP profile — and never invent your stories.";
    }
    setThinking(false);
    const at = new Date().toISOString();
    setMessages((ms) => [...ms, { id: `a-${at}`, role: "assistant", text: reply, at }]);
  }

  function decideMockMove(id: string, status: "accepted" | "declined") {
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
            <span className="text-sm font-semibold">
              {thread?.title ?? "New thread"}
            </span>
            <button onClick={newThread} className="btn-ghost px-3 py-1 text-xs">
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
            {signedIn && me.ipProfile.goals.length === 0 && (
              <p className="text-xs text-ink-muted">
                No goals yet — state them when you tell your story in
                Creator IP, and reviews will hold you to them.
              </p>
            )}
            <ul className="flex flex-col gap-2.5">
              {(signedIn ? me.ipProfile.goals : CREATOR.ipProfile.goals).map((g, i) => (
                <li key={i} className="rounded-xl bg-surface-2 px-3.5 py-2.5">
                  <p className="text-sm text-ink-2">{g.statement}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{g.horizon}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Latest growth review"
            action={
              <button
                onClick={startReview}
                disabled={reviewing}
                className="btn-primary px-3 py-1 text-[11px]"
              >
                {reviewing ? "Reviewing…" : "Run review"}
              </button>
            }
          >
            {reviewing && (
              <p className="mb-3 flex items-center gap-2 text-xs text-ink-2">
                <span aria-hidden className="inline-block size-2 animate-pulse rounded-full bg-accent" />
                {reviewProgress || "Working…"}
              </p>
            )}
            {signedIn && liveReviews !== null ? (
              liveReviews.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  No reviews yet. Run one — it reads your goals, pillar
                  coverage, and logged results, and proposes moves you can
                  accept into the brand book.
                </p>
              ) : (
                <>
                  <p className="mb-2 text-[11px] text-ink-muted">
                    {fmtDate(liveReviews[0].at)}
                  </p>
                  <p className="text-xs leading-relaxed text-ink-2">
                    {liveReviews[0].summary}
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {liveReviews[0].moves.map((m, i) => (
                      <li key={i} className="rounded-xl bg-surface-2 p-3">
                        <p className="text-xs font-semibold">{m.title}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                          {m.rationale}
                        </p>
                        {m.status === "proposed" ? (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => decideLiveMove(liveReviews[0], i, true)}
                              className="btn-primary px-3 py-1 text-[11px]"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => decideLiveMove(liveReviews[0], i, false)}
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
                              ? "Accepted → brand book amended"
                              : "Declined"}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )
            ) : (
              <>
                <p className="mb-2 text-[11px] text-ink-muted">{fmtDate(REVIEW.at)}</p>
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
                            onClick={() => decideMockMove(m.id!, "accepted")}
                            className="btn-primary px-3 py-1 text-[11px]"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => decideMockMove(m.id!, "declined")}
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
              </>
            )}
          </Card>

          <Card title="Threads">
            {threads.length === 0 && (
              <p className="text-xs text-ink-muted">
                No threads yet — say something below.
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {threads.map((t) => (
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
