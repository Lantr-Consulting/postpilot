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
import { CREATOR, REVIEW, THREADS } from "@/lib/mock.localized";
import type { ChatMessage } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, SectionHeading } from "@/components/ui";
import { pick, useLanguage } from "@/lib/language";

interface ThreadStub {
  id: string;
  title: string;
  updatedAt: string;
}

export default function GrowthLeadPage() {
  const toast = useToast();
  const language = useLanguage();
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
      toast("info", pick(language, "登录后可以回顾自己的内容表现；当前显示的是演示数据。", "Sign in to review your own performance. This is demo data."));
      return;
    }
    setReviewing(true);
    try {
      const run = await runReview();
      const done = await pollRun(run.id, (r) => setReviewProgress(r.progress || pick(language, "正在回顾…", "Reviewing…")));
      if (done.status === "done") {
        setLiveReviews(await getReviews());
        toast("success", pick(language, "回顾完成，请在下方确认是否采用这些建议。", "Review complete. Decide which recommendations to keep below."));
      } else {
        toast("error", done.report ?? pick(language, "回顾没有完成，请重试。", "The review did not finish. Please try again."));
      }
    } catch (e) {
      toast("error", e instanceof Error ? e.message : pick(language, "回顾没有完成，请重试。", "The review did not finish. Please try again."));
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
        toast("success", pick(language, "建议已采用，并写入内容档案作为长期要求。", "Recommendation accepted and added to the content profile as a standing instruction."));
      } else {
        toast("info", pick(language, "已标记为不采用。", "Recommendation declined."));
      }
    } catch (e) {
      toast("error", e instanceof Error ? e.message : pick(language, "无法保存这个选择。", "Unable to save that choice."));
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
      toast("info", pick(language, "登录后可以保存对话；当前显示的是演示数据。", "Sign in to save conversations. This is demo data."));
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
      reply = pick(language, "服务暂时不可用，因此这里显示演示回复。服务恢复后，我会根据你的内容档案和真实材料回答，不会编造你的经历。", "The service is temporarily unavailable, so this is a demo reply. When it returns, I will answer from your content profile and real source material without inventing your story.");
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
        ? pick(language, "建议已采用，内容档案会生成一个新版本。", "Recommendation accepted. The content profile will receive a new version.")
        : pick(language, "已标记为不采用，下次回顾会参考。", "Declined. The next review will take that into account.")
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title={pick(language, "内容顾问", "Content advisor")}
        sub={pick(language, "围绕你的内容档案、材料库和实际发布结果讨论选题，并定期回顾哪些内容有效。", "Discuss ideas using your content profile, source library, and actual results, then review what is working over time.")}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Chat */}
        <Card className="flex min-h-[420px] flex-col">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-hairline pb-3">
            <span className="text-sm font-semibold">
              {thread?.title ?? pick(language, "新对话", "New conversation")}
            </span>
            <button onClick={newThread} className="btn-ghost px-3 py-1 text-xs">
              {pick(language, "新建对话", "New conversation")}
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
                  {fmtTime(m.at, language)}
                </p>
              </div>
            ))}
            {thinking && (
              <div className="max-w-[85%] animate-[msg-in_.15s_ease-out] self-start rounded-2xl bg-surface-2 px-4 py-2.5 text-sm text-ink-muted">
                {pick(language, "正在整理…", "Thinking…")}
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={pick(language, "例如：帮我安排这周的内容", "Example: Help me plan this week's content")}
              className="flex-1 rounded-full border border-hairline bg-page px-4 py-2 text-sm text-ink placeholder:text-ink-muted"
            />
            <button onClick={send} className="btn-primary px-4 py-2 text-sm">
              {pick(language, "发送", "Send")}
            </button>
          </div>
        </Card>

        {/* Right rail */}
        <div className="flex flex-col gap-5">
          <Card title={pick(language, "内容目标", "Content goals")}>
            {signedIn && me.ipProfile.goals.length === 0 && (
              <p className="text-xs text-ink-muted">
                {pick(language, "还没有内容目标。可以在内容档案中补充，之后的回顾会根据这些目标提出建议。", "No content goals yet. Add them to your content profile so future reviews can work toward them.")}
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
            title={pick(language, "最近一次内容回顾", "Latest content review")}
            action={
              <button
                onClick={startReview}
                disabled={reviewing}
                className="btn-primary px-3 py-1 text-[11px]"
              >
                {reviewing ? pick(language, "正在回顾…", "Reviewing…") : pick(language, "开始回顾", "Start review")}
              </button>
            }
          >
            {reviewing && (
              <p className="mb-3 flex items-center gap-2 text-xs text-ink-2">
                <span aria-hidden className="inline-block size-2 animate-pulse rounded-full bg-accent" />
                {reviewProgress || pick(language, "正在回顾…", "Reviewing…")}
              </p>
            )}
            {signedIn && liveReviews !== null ? (
              liveReviews.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  {pick(language, "还没有完成过内容回顾。开始后，产品会查看内容目标、各方向的发布情况和已记录的数据，再提出可以由你确认的调整建议。", "No content review yet. Start one to compare goals, publishing mix, and logged results, then decide which recommendations to keep.")}
                </p>
              ) : (
                <>
                  <p className="mb-2 text-[11px] text-ink-muted">
                    {fmtDate(liveReviews[0].at, language)}
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
                              {pick(language, "采用", "Accept")}
                            </button>
                            <button
                              onClick={() => decideLiveMove(liveReviews[0], i, false)}
                              className="btn-ghost px-3 py-1 text-[11px]"
                            >
                              {pick(language, "不采用", "Decline")}
                            </button>
                          </div>
                        ) : (
                          <p
                            className={`mt-2 text-[11px] font-medium ${
                              m.status === "accepted" ? "text-good" : "text-ink-muted"
                            }`}
                          >
                            {m.status === "accepted"
                              ? pick(language, "已采用，内容档案已经更新", "Accepted · content profile updated")
                              : pick(language, "未采用", "Declined")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )
            ) : (
              <>
                <p className="mb-2 text-[11px] text-ink-muted">{fmtDate(REVIEW.at, language)}</p>
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
                            {pick(language, "采用", "Accept")}
                          </button>
                          <button
                            onClick={() => decideMockMove(m.id!, "declined")}
                            className="btn-ghost px-3 py-1 text-[11px]"
                          >
                            {pick(language, "不采用", "Decline")}
                          </button>
                        </div>
                      ) : (
                        <p
                          className={`mt-2 text-[11px] font-medium ${
                            m.status === "accepted" ? "text-good" : "text-ink-muted"
                          }`}
                        >
                          {m.status === "accepted"
                            ? pick(language, "已采用，内容档案已经更新", "Accepted · content profile updated")
                            : pick(language, "未采用", "Declined")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card title={pick(language, "历史对话", "Conversation history")}>
            {threads.length === 0 && (
              <p className="text-xs text-ink-muted">
                {pick(language, "还没有保存过对话，可以先从左侧开始交流。", "No saved conversations yet. Start one on the left.")}
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
                      {fmtDate(t.updatedAt, language)}
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
