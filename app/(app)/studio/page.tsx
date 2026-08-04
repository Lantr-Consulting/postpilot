"use client";

import { useEffect, useState } from "react";
import {
  acceptIdea,
  approveDraft,
  declineDraft,
  declineIdea,
  editDraft,
  exportDraft,
  getTrends,
  pollRun,
  runResearch,
  steerRun,
} from "@/lib/api";
import { useWorkspace } from "@/lib/use-workspace";
import { ATOMS, CREATOR, DRAFTS, IDEAS, TRENDS } from "@/lib/mock";
import type { Draft, Idea, TrendItem, TrendSource } from "@/lib/types";
import { useToast } from "@/components/toast";
import {
  Card,
  CheckList,
  DraftBadge,
  IdeaBadge,
  PLATFORM_EDGE,
  PlatformChip,
  SectionHeading,
} from "@/components/ui";
import { pick, useLanguage } from "@/lib/language";

const SOURCE_LABEL: Record<TrendSource, { zh: string; en: string }> = {
  youtube: { zh: "YouTube", en: "YouTube" },
  reddit: { zh: "Reddit", en: "Reddit" },
  bluesky: { zh: "Bluesky", en: "Bluesky" },
  news: { zh: "新闻", en: "News" },
  trends: { zh: "搜索趋势", en: "Search trends" },
};

function apiMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message.length > 3 ? e.message : fallback;
}

export default function StudioPage() {
  const toast = useToast();
  const language = useLanguage();
  const { ws, live, refresh } = useWorkspace();

  // Mock-mode local state — the offline fallback keeps its M1 interactivity.
  const [mockIdeas, setMockIdeas] = useState<Idea[]>(IDEAS);
  const [mockDrafts, setMockDrafts] = useState<Draft[]>(DRAFTS);

  const ideas = live && ws ? ws.ideas : mockIdeas;
  const drafts = live && ws ? ws.drafts : mockDrafts;
  const atoms = live && ws ? ws.atoms : ATOMS;

  const [editing, setEditing] = useState<string | null>(null);
  const [researching, setResearching] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [runProgress, setRunProgress] = useState("");
  const [steerNote, setSteerNote] = useState("");
  const [draftingIdea, setDraftingIdea] = useState<string | null>(null);
  const [busyDraft, setBusyDraft] = useState<string | null>(null);

  const [trends, setTrends] = useState<TrendItem[]>(TRENDS);
  const [radarLive, setRadarLive] = useState(false);
  useEffect(() => {
    getTrends(CREATOR.niche)
      .then((items) => {
        if (items.length) {
          setTrends(items);
          setRadarLive(true);
        }
      })
      .catch(() => {}); // offline → the M1 sample rail stands
  }, []);

  async function research() {
    if (!live) {
      toast("info", pick(language, "登录后可以建立自己的创作流程；当前显示的是演示数据。", "Sign in to build your own workflow. This is demo data."));
      return;
    }
    setResearching(true);
    setRunProgress(pick(language, "正在准备研究任务…", "Preparing research…"));
    try {
      const run = await runResearch();
      setRunId(run.id);
      const done = await pollRun(run.id, (r) => setRunProgress(r.progress || pick(language, "正在研究…", "Researching…")));
      await refresh();
      if (done.status === "done") {
        toast("success", done.report ?? pick(language, "研究完成。", "Research complete."));
      } else {
        toast("error", done.report ?? pick(language, "研究没有完成，请重试。", "Research did not finish. Please try again."));
      }
    } catch (e) {
      toast("error", apiMessage(e, pick(language, "无法开始研究，请稍后重试。", "Unable to start research. Please try again.")));
    }
    setResearching(false);
    setRunId(null);
    setRunProgress("");
  }

  async function sendSteer() {
    const note = steerNote.trim();
    if (!note || !runId) return;
    setSteerNote("");
    try {
      await steerRun(runId, note);
      toast("info", pick(language, "补充要求已保存，整理选题前会先读取。", "Direction saved. The run will read it before shaping ideas."));
    } catch {
      toast("info", pick(language, "这次研究已经结束，可以在下一次研究前补充要求。", "This run has already finished. Add that direction before the next one."));
    }
  }

  async function decideIdea(id: string, status: "accepted" | "declined") {
    if (status === "declined") {
      const reason = window.prompt(pick(language, "为什么不采用？这个原因会成为下次研究的参考。", "Why not? This will guide the next research run."));
      if (reason === null) return;
      if (live) {
        await declineIdea(id, reason).catch(() => {});
        await refresh();
      } else {
        setMockIdeas((xs) =>
          xs.map((i) => (i.id === id ? { ...i, status, declineReason: reason } : i))
        );
      }
      toast("info", pick(language, "已标记为不采用，下次研究会参考你填写的原因。", "Declined. Your reason will guide the next run."));
      return;
    }
    if (live) {
      setDraftingIdea(id);
      try {
        const { drafts: fresh } = await acceptIdea(id);
        await refresh();
        toast("success", pick(language, `已为 ${fresh.length} 个平台准备初稿并完成检查。`, `${fresh.length} platform drafts are ready and checked.`));
      } catch (e) {
        toast("error", apiMessage(e, pick(language, "初稿生成失败，请重新尝试。", "Drafting failed. Please try again.")));
      }
      setDraftingIdea(null);
    } else {
      setMockIdeas((xs) => xs.map((i) => (i.id === id ? { ...i, status } : i)));
      toast("success", pick(language, "选题已采用，初稿会显示在下方。（演示数据）", "Idea accepted. Drafts will appear below. (Demo data)"));
    }
  }

  async function saveEdit(d: Draft, text: string) {
    setEditing(null);
    if (live) {
      await editDraft(d.id, text).catch(() => {});
      await refresh();
      toast("info", pick(language, "修改已保存，产品已经重新检查文字。", "Edit saved and checks rerun."));
    } else {
      setMockDrafts((xs) => xs.map((x) => (x.id === d.id ? { ...x, text } : x)));
      toast("info", pick(language, "修改已保存；通过初稿时会再次检查。", "Edit saved. The draft will be checked again on approval."));
    }
  }

  async function approve(d: Draft) {
    if (!live) {
      setMockDrafts((xs) =>
        xs.map((x) => (x.id === d.id ? { ...x, status: "approved" } : x))
      );
      toast("success", pick(language, "初稿已通过，最终文字已重新检查。", "Draft approved after a final check."));
      return;
    }
    setBusyDraft(d.id);
    try {
      const { blockedChecks } = await approveDraft(d.id, d.text);
      await refresh();
      if (blockedChecks) {
        toast("error", pick(language, "这篇初稿还有未通过的检查，请先处理标记项。", "This draft still has failed checks. Resolve them first."));
      } else {
        toast("success", pick(language, "初稿已通过并排入内容日历。", "Draft approved and added to the calendar."));
      }
    } catch {
      toast("error", pick(language, "无法通过这篇初稿，请稍后重试。", "Unable to approve this draft. Please try again."));
    }
    setBusyDraft(null);
  }

  async function decline(d: Draft) {
    const reason = window.prompt(pick(language, "为什么不采用？这个原因会成为下次写作的参考。", "Why not? This will guide future drafts."));
    if (reason === null) return;
    if (live) {
      await declineDraft(d.id, reason).catch(() => {});
      await refresh();
    } else {
      setMockDrafts((xs) =>
        xs.map((x) => (x.id === d.id ? { ...x, status: "declined" } : x))
      );
    }
    toast("info", pick(language, "已标记为不采用，下次写作会参考这个原因。", "Declined. The reason will guide future drafts."));
  }

  async function copyExport(d: Draft) {
    const pack = d.text + (d.hashtags.length ? `\n${d.hashtags.join(" ")}` : "");
    navigator.clipboard?.writeText(pack).catch(() => {});
    if (live) {
      await exportDraft(d.id).catch(() => {});
      await refresh();
    } else {
      setMockDrafts((xs) =>
        xs.map((x) => (x.id === d.id ? { ...x, status: "exported" } : x))
      );
    }
    toast("success", pick(language, "内容已复制，请前往对应平台发布。", "Copied. Open the platform and publish it yourself."));
  }

  const knownAtoms = new Map(atoms.map((a) => [a.id, a]));

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title={pick(language, "内容工作台", "Content studio")}
        sub={pick(language, "查看近期动态和真实材料，确认选题，审核初稿，再由你亲自导出和发布。", "Review live signals and source material, choose ideas, review drafts, then export and publish them yourself.")}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-5">
          {/* Ideas */}
          <Card
            title={pick(language, "待确认的选题", "Ideas awaiting review")}
            action={
              <button
                onClick={research}
                disabled={researching}
                className="btn-primary px-3.5 py-1.5 text-xs"
              >
                {researching ? pick(language, "正在研究…", "Researching…") : pick(language, "开始研究", "Start research")}
              </button>
            }
          >
            {researching && (
              <div className="index-card mb-4 rounded-xl p-3.5">
                <p className="flex items-center gap-2 text-xs text-ink-2">
                  <span aria-hidden className="inline-block size-2 animate-pulse rounded-full bg-accent" />
                  {runProgress || pick(language, "正在研究…", "Researching…")}
                </p>
                <div className="mt-2.5 flex gap-2">
                  <input
                    value={steerNote}
                    onChange={(e) => setSteerNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendSteer()}
                    placeholder={pick(language, "补充要求，例如：更关注邮件通讯的角度", "Add direction, e.g. focus more on newsletter angles")}
                    className="flex-1 rounded-full border border-hairline bg-page px-3.5 py-1.5 text-xs text-ink placeholder:text-ink-muted"
                  />
                  <button onClick={sendSteer} className="btn-ghost px-3 py-1.5 text-xs">
                    {pick(language, "发送", "Send")}
                  </button>
                </div>
              </div>
            )}
            {ideas.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {pick(language, "还没有选题。开始研究后，产品会查看近期动态和材料库，并说明每个选题的依据。", "No ideas yet. Start research to scan current signals and your library, with evidence for every idea.")}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {ideas.map((idea) => (
                  <li key={idea.id} className="rounded-xl bg-surface-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{idea.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                          {idea.pillar}
                          {idea.narrative && (
                            <span className="rounded-full bg-atom-quote/15 px-2 py-0.5 text-[10px] font-medium text-atom-quote">
                              {pick(language, "故事线：", "Arc: ")}{idea.narrative}
                            </span>
                          )}
                        </div>
                      </div>
                      <IdeaBadge status={idea.status} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">
                      {idea.angle}
                    </p>
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {idea.evidence.map((e, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span
                            className={`mt-px inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 font-semibold ${
                              e.atomId
                                ? "bg-atom-story/15 text-atom-story"
                                : "bg-wash-2 text-ink-2"
                            }`}
                          >
                            {e.atomId ? pick(language, "你的材料", "Your material") : e.source}
                          </span>
                          <span className="text-ink-muted">{e.datum}</span>
                        </li>
                      ))}
                    </ul>
                    {idea.declineReason && (
                      <p className="mt-2 rounded-lg bg-wash px-3 py-2 text-xs text-ink-muted">
                        {pick(language, "下次研究需要注意：", "Direction for the next run: ")}{idea.declineReason}
                      </p>
                    )}
                    {idea.status === "proposed" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => decideIdea(idea.id, "accepted")}
                          disabled={draftingIdea !== null}
                          className="btn-primary px-3.5 py-1.5 text-xs"
                        >
                          {draftingIdea === idea.id
                            ? pick(language, "正在准备初稿…", "Drafting…")
                            : pick(language, "采用并生成初稿", "Accept and draft")}
                        </button>
                        <button
                          onClick={() => decideIdea(idea.id, "declined")}
                          className="btn-ghost px-3.5 py-1.5 text-xs"
                        >
                          {pick(language, "不采用…", "Decline…")}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Drafts */}
          <Card title={pick(language, "待审核的初稿", "Drafts to review")}>
            {drafts.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {pick(language, "采用上方选题后，不同平台的初稿会出现在这里，并先完成内容规则检查。", "Accept an idea above and platform-specific drafts will appear here after editorial checks.")}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {drafts.map((d) => {
                  const blocked = d.checks.some((c) => !c.pass);
                  const cited = d.atomIds
                    .map((id) => knownAtoms.get(id))
                    .filter((v) => Boolean(v));
                  return (
                    <li
                      key={d.id}
                      className={`rounded-xl border-l-2 bg-surface-2 p-4 ${PLATFORM_EDGE[d.platform]}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <PlatformChip platform={d.platform} />
                          {d.sponsored && (
                            <span className="rounded-full bg-critical/15 px-2 py-0.5 text-[11px] font-semibold text-critical">
                              {pick(language, "含推广内容", "Sponsored")}
                            </span>
                          )}
                          <span className="truncate text-xs text-ink-muted">
                            {d.ideaTitle}
                          </span>
                        </div>
                        <DraftBadge status={d.status} />
                      </div>

                      {editing === d.id ? (
                        <textarea
                          defaultValue={d.text}
                          onBlur={(e) => saveEdit(d, e.target.value)}
                          autoFocus
                          rows={6}
                          className="mt-3 w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink"
                        />
                      ) : (
                        <p className="mt-3 whitespace-pre-line rounded-lg bg-page/60 p-3 text-sm leading-relaxed text-ink-2">
                          {d.text}
                          {d.hashtags.length > 0 && (
                            <span className="mt-2 block text-accent">
                              {d.hashtags.join(" ")}
                            </span>
                          )}
                        </p>
                      )}

                      {cited.length > 0 && (
                        <p className="mt-2 text-xs text-ink-muted">
                          {pick(language, "使用材料：", "Sources: ")}{" "}
                          {cited.map((a, index) => a && (
                            <span key={a.id}>
                              {index > 0 && " · "}
                              <a href={`/library#${a.id}`} className="underline underline-offset-2 hover:text-ink">
                                {a.materialTitle}
                              </a>
                            </span>
                          ))}
                        </p>
                      )}

                      <div className="mt-3">
                        <CheckList checks={d.checks} />
                      </div>

                      {(d.status === "draft" || d.status === "approved") && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {d.status === "draft" && (
                            <>
                              <button
                                onClick={() => approve(d)}
                                disabled={blocked || busyDraft === d.id}
                                className="btn-primary px-3.5 py-1.5 text-xs"
                                title={blocked ? pick(language, "请先处理未通过的检查", "Resolve failed checks first") : undefined}
                              >
                                {busyDraft === d.id ? pick(language, "正在检查…", "Checking…") : pick(language, "通过", "Approve")}
                              </button>
                              <button
                                onClick={() => setEditing(d.id)}
                                className="btn-ghost px-3.5 py-1.5 text-xs"
                              >
                                {pick(language, "修改", "Edit")}
                              </button>
                              <button
                                onClick={() => decline(d)}
                                className="btn-ghost px-3.5 py-1.5 text-xs"
                              >
                                {pick(language, "不采用", "Decline")}
                              </button>
                            </>
                          )}
                          {d.status === "approved" && (
                            <button
                              onClick={() => copyExport(d)}
                              className="btn-primary px-3.5 py-1.5 text-xs"
                            >
                              {pick(language, "复制并导出", "Copy and export")}
                            </button>
                          )}
                          {blocked && (
                            <span className="self-center text-xs text-critical">
                              {pick(language, "处理完标记项后才能通过。", "Resolve the flagged checks before approval.")}
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Niche radar rail */}
        <div className="flex flex-col gap-5">
          <Card
            title={pick(language, "选题动态", "Signal radar")}
            action={
              <span
                className={`text-xs font-medium ${radarLive ? "text-good" : "text-ink-muted"}`}
              >
                {radarLive ? pick(language, "实时", "Live") : pick(language, "演示", "Demo")}
              </span>
            }
          >
            <ul className="flex flex-col gap-3">
              {trends.map((t) => (
                <li key={t.id} className="rounded-xl bg-surface-2 p-3">
                  <span className="rounded-full bg-wash-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                    {SOURCE_LABEL[t.source][language]}
                  </span>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
                    {t.url ? (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-ink hover:underline"
                      >
                        {t.title}
                      </a>
                    ) : (
                      t.title
                    )}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-muted">{t.datum}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
