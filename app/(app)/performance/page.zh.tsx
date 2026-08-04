"use client";

import { useEffect, useState } from "react";
import { getResults, getReviews, logResult, type Review } from "@/lib/api";
import { useWorkspace } from "@/lib/use-workspace";
import { RESULTS } from "@/lib/mock";
import type { Metrics, Platform, ResultLog } from "@/lib/types";
import { fmtDate, fmtNum } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, PlatformChip, SectionHeading, Stat } from "@/components/ui";
import { pick, useLanguage } from "@/lib/language";

const METRIC_KEYS = ["views", "likes", "comments", "saves", "follows"] as const;
const METRIC_LABEL: Record<(typeof METRIC_KEYS)[number], { zh: string; en: string }> = {
  views: { zh: "浏览", en: "Views" },
  likes: { zh: "点赞", en: "Likes" },
  comments: { zh: "评论", en: "Comments" },
  saves: { zh: "收藏", en: "Saves" },
  follows: { zh: "新增关注", en: "Follows" },
};

export default function PerformancePage() {
  const toast = useToast();
  const language = useLanguage();
  const { ws, live, refresh } = useWorkspace();

  const [liveResults, setLiveResults] = useState<ResultLog[] | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    if (!live) return;
    let alive = true;
    getResults().then((r) => alive && setLiveResults(r)).catch(() => {});
    getReviews().then((r) => alive && setReviews(r)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [live]);

  const results = live && liveResults !== null ? liveResults : RESULTS;

  // The log form — you posted it, now close the loop.
  const [logging, setLogging] = useState(false);
  const [draftId, setDraftId] = useState<string>("");
  const [metrics, setMetrics] = useState<Metrics>({ views: 0, likes: 0, comments: 0, saves: 0, follows: 0 });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loggable = (ws?.drafts ?? []).filter(
    (d) => d.status === "exported" || d.status === "approved"
  );

  async function submitLog() {
    const draft = loggable.find((d) => d.id === draftId);
    if (!draft) return;
    setSaving(true);
    try {
      await logResult({
        draftId: draft.id,
        title: draft.ideaTitle || draft.text.slice(0, 60),
        platform: draft.platform as Platform,
        postedAt: new Date().toISOString().slice(0, 10),
        metrics,
        notes: notes || undefined,
      });
      setLiveResults(await getResults());
      await refresh();
      setLogging(false);
      setDraftId("");
      setMetrics({ views: 0, likes: 0, comments: 0, saves: 0, follows: 0 });
      setNotes("");
      toast("success", pick(language, "发布结果已记录，下一次内容回顾会参考这些数据。", "Results saved. The next content review will use them."));
    } catch (e) {
      toast("error", e instanceof Error ? e.message : pick(language, "保存失败。", "Save failed."));
    }
    setSaving(false);
  }

  const totals = results.reduce(
    (acc, r) => ({
      views: acc.views + r.metrics.views,
      saves: acc.saves + r.metrics.saves,
      follows: acc.follows + r.metrics.follows,
    }),
    { views: 0, saves: 0, follows: 0 }
  );
  const maxViews = Math.max(1, ...results.map((r) => r.metrics.views));

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title={pick(language, "内容表现", "Performance")}
        sub={pick(language, "发布结果由你自行记录。产品只根据你保存的数据提出建议，不会声称已经连接平台账户。", "You log published results yourself. PostPilot only reasons from saved data and never claims a platform connection it does not have.")}
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label={pick(language, `最近 ${results.length} 篇内容的浏览量`, `Views across ${results.length} recent posts`)} value={fmtNum(totals.views, language)} />
        <Stat label={pick(language, "收藏", "Saves")} value={fmtNum(totals.saves, language)} hint={pick(language, "可以反映内容的长期价值", "a signal of lasting value")} />
        <Stat label={pick(language, "新增关注", "New followers")} value={fmtNum(totals.follows, language)} />
      </div>

      {results.length > 0 && (
        <Card title={pick(language, "各篇内容浏览量", "Views by post")}>
          <ul className="flex flex-col gap-2.5">
            {results.map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                <span className="w-40 truncate text-xs text-ink-2 sm:w-56">
                  {r.title}
                </span>
                <span className="relative h-5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 rounded-full bg-accent/70"
                    style={{ width: `${(r.metrics.views / maxViews) * 100}%` }}
                  />
                </span>
                <span
                  className="w-12 text-right text-xs text-ink-muted"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {fmtNum(r.metrics.views, language)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        title={pick(language, "已记录的发布结果", "Logged results")}
        action={
          <button
            onClick={() => {
              if (!live) {
                toast("info", pick(language, "登录后可以记录自己的发布结果。（演示数据）", "Sign in to log your own results. (Demo data)"));
                return;
              }
              if (loggable.length === 0) {
                toast("info", pick(language, "还没有可以记录的内容，请先导出并发布一篇初稿。", "There is nothing to log yet. Export and publish a draft first."));
                return;
              }
              setLogging((v) => !v);
            }}
            className="btn-primary px-3.5 py-1.5 text-xs"
          >
            {logging ? pick(language, "关闭", "Close") : pick(language, "记录发布结果", "Log results")}
          </button>
        }
      >
        {logging && (
          <div className="mb-4 rounded-xl border border-hairline p-4">
            <label className="text-xs font-medium text-ink-2" htmlFor="log-draft">
              {pick(language, "你发布了哪一篇内容？", "Which post did you publish?")}
            </label>
            <select
              id="log-draft"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink"
            >
              <option value="">{pick(language, "请选择已导出的初稿…", "Choose an exported draft…")}</option>
              {loggable.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.platform}] {(d.ideaTitle || d.text).slice(0, 60)}
                </option>
              ))}
            </select>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {METRIC_KEYS.map((k) => (
                <label key={k} className="text-[11px] text-ink-muted">
                  {METRIC_LABEL[k][language]}
                  <input
                    type="number"
                    min={0}
                    value={metrics[k] || ""}
                    onChange={(e) =>
                      setMetrics((m) => ({ ...m, [k]: Math.max(0, Number(e.target.value) || 0) }))
                    }
                    className="mt-1 w-full rounded-lg border border-hairline bg-page px-2 py-1.5 text-sm text-ink"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </label>
              ))}
            </div>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={pick(language, "补充说明：你认为这篇内容为什么有效或无效？", "Notes: why do you think this post worked or did not?")}
              className="mt-3 w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
            />
            <button
              onClick={submitLog}
              disabled={!draftId || saving}
              className="btn-primary mt-3 px-3.5 py-1.5 text-xs"
            >
              {saving ? pick(language, "正在保存…", "Saving…") : pick(language, "保存结果", "Save results")}
            </button>
          </div>
        )}

        {results.length === 0 ? (
          <p className="text-sm text-ink-muted">
            {pick(language, "还没有发布结果。导出并亲自发布内容后，可以回来记录它的实际表现。", "No results yet. Export and publish a post, then return to log how it performed.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs text-ink-muted">
                  <th className="pb-2 pr-3 font-medium">{pick(language, "内容", "Post")}</th>
                  <th className="pb-2 pr-3 font-medium">{pick(language, "平台", "Platform")}</th>
                  <th className="pb-2 pr-3 font-medium">{pick(language, "日期", "Date")}</th>
                  <th className="pb-2 pr-3 text-right font-medium">{pick(language, "浏览", "Views")}</th>
                  <th className="pb-2 pr-3 text-right font-medium">{pick(language, "点赞", "Likes")}</th>
                  <th className="pb-2 pr-3 text-right font-medium">{pick(language, "收藏", "Saves")}</th>
                  <th className="pb-2 text-right font-medium">{pick(language, "新增关注", "Follows")}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-hairline/50">
                    <td className="max-w-52 truncate py-2.5 pr-3 text-ink-2">
                      {r.title}
                    </td>
                    <td className="py-2.5 pr-3">
                      <PlatformChip platform={r.platform} />
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-ink-muted">
                      {fmtDate(r.postedAt, language)}
                    </td>
                    {(["views", "likes", "saves", "follows"] as const).map((k) => (
                      <td
                        key={k}
                        className="py-2.5 pr-3 text-right text-ink-2 last:pr-0"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {fmtNum(r.metrics[k], language)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={pick(language, "内容顾问会看到什么", "What the content advisor sees")}>
        {live && reviews.length > 0 ? (
          <>
            <p className="text-sm leading-relaxed text-ink-2">{reviews[0].summary}</p>
            <p className="mt-3 text-xs text-ink-muted">
              {pick(language, "来自最近一次内容回顾（", "From the latest content review (")}{fmtDate(reviews[0].at, language)}{pick(language, "）。你确认采用的建议会成为之后写作时的长期要求。", "). Recommendations you accept become standing instructions.")}
            </p>
          </>
        ) : (
          <>
            <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
              <li>· {pick(language, "以具体数字开头的内容，浏览量大约是提问式开头的 5 倍。", "Posts that open with a concrete number drew about 5× the views of question-led openings.")}</li>
              <li>· {pick(language, "关于职业倦怠的亲身经历带来了最多评论，也更容易获得关注。", "The burnout story earned the most comments and converted more followers.")}</li>
              <li>· {pick(language, "客户故事的关注转化最好，但目前发布得太少。", "Client stories convert best, but they are still underused.")}</li>
            </ul>
            <p className="mt-3 text-xs text-ink-muted">
              {live
                ? pick(language, "开始一次内容回顾，查看属于你自己的建议。", "Start a content review to see recommendations based on your own data.")
                : pick(language, "你确认采用的建议会成为之后写作时的长期要求。", "Recommendations you accept become standing instructions for future writing.")}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
