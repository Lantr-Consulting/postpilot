"use client";

import { useEffect, useState } from "react";
import { getResults, getReviews, logResult, type Review } from "@/lib/api";
import { useWorkspace } from "@/lib/use-workspace";
import { RESULTS } from "@/lib/mock";
import type { Metrics, Platform, ResultLog } from "@/lib/types";
import { fmtDate, fmtNum } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, PlatformChip, SectionHeading, Stat } from "@/components/ui";

const METRIC_KEYS = ["views", "likes", "comments", "saves", "follows"] as const;
const METRIC_LABEL: Record<(typeof METRIC_KEYS)[number], string> = {
  views: "浏览",
  likes: "点赞",
  comments: "评论",
  saves: "收藏",
  follows: "新增关注",
};

export default function PerformancePage() {
  const toast = useToast();
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
      toast("success", "发布结果已记录，下一次内容回顾会参考这些数据。" );
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "保存失败。" );
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
        title="内容表现"
        sub="发布结果由你自行记录。产品只根据你保存的数据提出建议，不会声称已经连接平台账户。"
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label={`最近 ${results.length} 篇内容的浏览量`} value={fmtNum(totals.views)} />
        <Stat label="收藏" value={fmtNum(totals.saves)} hint="可以反映内容的长期价值" />
        <Stat label="新增关注" value={fmtNum(totals.follows)} />
      </div>

      {results.length > 0 && (
        <Card title="各篇内容浏览量">
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
                  {fmtNum(r.metrics.views)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        title="已记录的发布结果"
        action={
          <button
            onClick={() => {
              if (!live) {
                toast("info", "登录后可以记录自己的发布结果。（演示数据）" );
                return;
              }
              if (loggable.length === 0) {
                toast("info", "还没有可以记录的内容，请先导出并发布一篇初稿。" );
                return;
              }
              setLogging((v) => !v);
            }}
            className="btn-primary px-3.5 py-1.5 text-xs"
          >
            {logging ? "关闭" : "记录发布结果"}
          </button>
        }
      >
        {logging && (
          <div className="mb-4 rounded-xl border border-hairline p-4">
            <label className="text-xs font-medium text-ink-2" htmlFor="log-draft">
              你发布了哪一篇内容？
            </label>
            <select
              id="log-draft"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink"
            >
              <option value="">请选择已导出的初稿…</option>
              {loggable.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.platform}] {(d.ideaTitle || d.text).slice(0, 60)}
                </option>
              ))}
            </select>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {METRIC_KEYS.map((k) => (
                <label key={k} className="text-[11px] text-ink-muted">
                  {METRIC_LABEL[k]}
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
              placeholder="补充说明：你认为这篇内容为什么有效或无效？"
              className="mt-3 w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
            />
            <button
              onClick={submitLog}
              disabled={!draftId || saving}
              className="btn-primary mt-3 px-3.5 py-1.5 text-xs"
            >
              {saving ? "正在保存…" : "保存结果"}
            </button>
          </div>
        )}

        {results.length === 0 ? (
          <p className="text-sm text-ink-muted">
            还没有发布结果。导出并亲自发布内容后，可以回来记录它的实际表现。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs text-ink-muted">
                  <th className="pb-2 pr-3 font-medium">内容</th>
                  <th className="pb-2 pr-3 font-medium">平台</th>
                  <th className="pb-2 pr-3 font-medium">日期</th>
                  <th className="pb-2 pr-3 text-right font-medium">浏览</th>
                  <th className="pb-2 pr-3 text-right font-medium">点赞</th>
                  <th className="pb-2 pr-3 text-right font-medium">收藏</th>
                  <th className="pb-2 text-right font-medium">新增关注</th>
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
                      {fmtDate(r.postedAt)}
                    </td>
                    {(["views", "likes", "saves", "follows"] as const).map((k) => (
                      <td
                        key={k}
                        className="py-2.5 pr-3 text-right text-ink-2 last:pr-0"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {fmtNum(r.metrics[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="内容顾问会看到什么">
        {live && reviews.length > 0 ? (
          <>
            <p className="text-sm leading-relaxed text-ink-2">{reviews[0].summary}</p>
            <p className="mt-3 text-xs text-ink-muted">
              来自最近一次内容回顾（{fmtDate(reviews[0].at)}）。你确认采用的建议会成为之后写作时的长期要求。
            </p>
          </>
        ) : (
          <>
            <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
              <li>· 以具体数字开头的内容，浏览量大约是提问式开头的 5 倍。</li>
              <li>· 关于职业倦怠的亲身经历带来了最多评论，也更容易获得关注。</li>
              <li>· 客户故事的关注转化最好，但目前发布得太少。</li>
            </ul>
            <p className="mt-3 text-xs text-ink-muted">
              {live
                ? "开始一次内容回顾，查看属于你自己的建议。"
                : "你确认采用的建议会成为之后写作时的长期要求。"}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
