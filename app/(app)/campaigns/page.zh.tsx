"use client";

import { useEffect, useState } from "react";
import {
  createCampaign,
  deleteCampaign,
  getCampaigns,
  pollRun,
  runCampaignNow,
  updateCampaign,
} from "@/lib/api";
import { useMe } from "@/lib/use-me";
import { CAMPAIGNS } from "@/lib/mock";
import type { Campaign } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, SectionHeading } from "@/components/ui";
import { pick, useLanguage } from "@/lib/language";

const CADENCE_LABEL: Record<Campaign["cadence"], { zh: string; en: string }> = {
  manual: { zh: "手动运行", en: "Manual" },
  daily: { zh: "每天", en: "Daily" },
  weekly: { zh: "每周", en: "Weekly" },
};

export default function CampaignsPage() {
  const toast = useToast();
  const language = useLanguage();
  const { me } = useMe();
  const signedIn = me !== null;

  const [liveCampaigns, setLiveCampaigns] = useState<Campaign[] | null>(null);
  const [mockCampaigns, setMockCampaigns] = useState<Campaign[]>(CAMPAIGNS);
  const [running, setRunning] = useState<string | null>(null);
  const [runProgress, setRunProgress] = useState("");

  // New-campaign form
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cadence, setCadence] = useState<Campaign["cadence"]>("weekly");
  const [hour, setHour] = useState(8);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    getCampaigns().then((cs) => alive && setLiveCampaigns(cs)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [signedIn]);

  const live = signedIn && liveCampaigns !== null;
  const campaignList = live ? liveCampaigns! : mockCampaigns;

  async function toggle(c: Campaign) {
    if (!live) {
      setMockCampaigns((cs) =>
        cs.map((x) => (x.id === c.id ? { ...x, enabled: !x.enabled } : x))
      );
      toast("info", pick(language, "已保存。（演示数据）", "Saved. (Demo data)"));
      return;
    }
    const updated = await updateCampaign(c.id, { enabled: !c.enabled }).catch(() => null);
    if (updated) {
      setLiveCampaigns((cs) => cs!.map((x) => (x.id === c.id ? updated : x)));
      toast(
        "info",
        updated.enabled
          ? pick(language, "定时任务已启用。", "Scheduled run enabled.")
          : pick(language, "定时任务已关闭，重新启用前不会运行。", "Scheduled run disabled until you turn it back on.")
      );
    }
  }

  async function runNow(c: Campaign) {
    if (!live) {
      toast("info", pick(language, "登录后可以运行自己的定时任务。（演示数据）", "Sign in to run your own scheduled work. (Demo data)"));
      return;
    }
    setRunning(c.id);
    setRunProgress(pick(language, "正在准备任务…", "Preparing the run…"));
    try {
      const run = await runCampaignNow(c.id);
      const done = await pollRun(run.id, (r) => setRunProgress(r.progress || pick(language, "正在运行…", "Running…")));
      setLiveCampaigns(await getCampaigns());
      toast(
        done.status === "done" ? "success" : "error",
        done.report ?? (done.status === "done" ? pick(language, "任务完成。", "Run complete.") : pick(language, "任务运行失败。", "The run failed."))
      );
    } catch (e) {
      toast("error", e instanceof Error ? e.message : pick(language, "无法开始任务。", "Unable to start the run."));
    }
    setRunning(null);
    setRunProgress("");
  }

  async function remove(c: Campaign) {
    if (!live || c.builtIn) return;
    if (!window.confirm(pick(language, `确定删除“${c.title}”吗？`, `Delete “${c.title}”?`))) return;
    await deleteCampaign(c.id).catch(() => {});
    setLiveCampaigns(await getCampaigns());
    toast("info", pick(language, "定时任务已删除。", "Scheduled run deleted."));
  }

  async function create() {
    if (!title.trim() || !prompt.trim()) return;
    if (!live) {
      toast("info", pick(language, "登录后可以建立自己的定时任务。（演示数据）", "Sign in to create your own scheduled runs. (Demo data)"));
      return;
    }
    setCreating(true);
    try {
      await createCampaign({ title, prompt, cadence, hourLocal: hour });
      setLiveCampaigns(await getCampaigns());
      setTitle("");
      setPrompt("");
      toast("success", pick(language, "定时任务已保存，到达设定时间后会自动运行。", "Scheduled run saved and ready for its next start time."));
    } catch (e) {
      toast("error", e instanceof Error ? e.message : pick(language, "无法保存定时任务。", "Unable to save the scheduled run."));
    }
    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title={pick(language, "定时任务", "Scheduled runs")}
        sub={pick(language, "按计划完成选题研究、内容准备和定期回顾。报告留在这里，选题会进入内容工作台。", "Schedule research, drafting, and regular reviews. Reports stay here and new ideas move into the Studio.")}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {campaignList.map((c) => (
          <Card
            key={c.id}
            title={c.title}
            action={
              <div className="flex items-center gap-2">
                {c.builtIn && (
                  <span className="rounded-full bg-wash-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                    {pick(language, "内置任务", "Built in")}
                  </span>
                )}
                <button
                  role="switch"
                  aria-checked={c.enabled}
                  onClick={() => toggle(c)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    c.enabled ? "bg-accent" : "bg-wash-2"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-4 rounded-full bg-page transition-transform ${
                      c.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            }
          >
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs italic leading-relaxed text-ink-2">
              “{c.prompt}”
            </p>
            <p className="mt-2 text-[11px] text-ink-muted">
              {CADENCE_LABEL[c.cadence][language]}
              {c.cadence !== "manual" && `，${String(c.hourLocal).padStart(2, "0")}:00 UTC`}
              {c.lastRunAt && ` · ${pick(language, "上次运行：", "Last run: ")}${fmtDate(c.lastRunAt.slice(0, 10), language)}`}
            </p>
            {running === c.id && (
              <p className="mt-2 flex items-center gap-2 text-xs text-ink-2">
                <span aria-hidden className="inline-block size-2 animate-pulse rounded-full bg-accent" />
                {runProgress}
              </p>
            )}
            {c.lastReport && (
              <div className="mt-3 rounded-xl border border-hairline p-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  {pick(language, "最近一次报告", "Latest report")}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-2">
                  {c.lastReport}
                </p>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => runNow(c)}
                disabled={running !== null}
                className="btn-ghost px-3.5 py-1.5 text-xs"
              >
                {running === c.id ? pick(language, "正在运行…", "Running…") : pick(language, "立即运行", "Run now")}
              </button>
              {live && !c.builtIn && (
                <button
                  onClick={() => remove(c)}
                  className="btn-ghost px-3.5 py-1.5 text-xs hover:text-critical"
                >
                  {pick(language, "删除", "Delete")}
                </button>
              )}
            </div>
          </Card>
        ))}

        <Card title={pick(language, "新建定时任务", "New scheduled run")}>
          <p className="text-xs leading-relaxed text-ink-muted">
            {pick(language, "用平常说话的方式写下需要定期完成的工作，例如“每周五根据本周动态，整理一个适合邮件通讯的选题”。", "Describe the recurring work in plain language, such as “Every Friday, turn this week's signals into one newsletter idea.”")}
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={pick(language, "任务名称", "Run name")}
            className="mt-3 w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
          />
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={pick(language, "例如：每周回顾内容表现，并提出下周调整建议", "Example: Review performance each week and suggest next week's adjustments")}
            className="mt-2 w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink placeholder:text-ink-muted"
          />
          <div className="mt-2 flex gap-2">
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as Campaign["cadence"])}
              className="flex-1 rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink"
            >
              <option value="manual">{pick(language, "手动运行", "Manual")}</option>
              <option value="daily">{pick(language, "每天", "Daily")}</option>
              <option value="weekly">{pick(language, "每周", "Weekly")}</option>
            </select>
            {cadence !== "manual" && (
              <select
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className="w-32 rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00 UTC
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={create}
            disabled={creating || !title.trim() || !prompt.trim()}
            className="btn-primary mt-3 px-3.5 py-2 text-sm"
          >
            {creating ? pick(language, "正在保存…", "Saving…") : pick(language, "创建定时任务", "Create scheduled run")}
          </button>
        </Card>
      </div>
    </div>
  );
}
