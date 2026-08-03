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

const CADENCE_LABEL: Record<Campaign["cadence"], string> = {
  manual: "Run manually",
  daily: "Daily",
  weekly: "Weekly",
};

export default function CampaignsPage() {
  const toast = useToast();
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
      toast("info", "Saved. (Sample data)");
      return;
    }
    const updated = await updateCampaign(c.id, { enabled: !c.enabled }).catch(() => null);
    if (updated) {
      setLiveCampaigns((cs) => cs!.map((x) => (x.id === c.id ? updated : x)));
      toast(
        "info",
        updated.enabled
          ? "On — the scheduler claims due campaigns once a minute."
          : "Off — it won't fire until you re-enable it."
      );
    }
  }

  async function runNow(c: Campaign) {
    if (!live) {
      toast("info", "Sign in to run real campaigns. (Sample data)");
      return;
    }
    setRunning(c.id);
    setRunProgress("Claiming the run…");
    try {
      const run = await runCampaignNow(c.id);
      const done = await pollRun(run.id, (r) => setRunProgress(r.progress || "Working…"));
      setLiveCampaigns(await getCampaigns());
      toast(
        done.status === "done" ? "success" : "error",
        done.report ?? (done.status === "done" ? "Done." : "Run failed.")
      );
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Couldn't start the run.");
    }
    setRunning(null);
    setRunProgress("");
  }

  async function remove(c: Campaign) {
    if (!live || c.builtIn) return;
    if (!window.confirm(`Delete “${c.title}”?`)) return;
    await deleteCampaign(c.id).catch(() => {});
    setLiveCampaigns(await getCampaigns());
    toast("info", "Campaign deleted.");
  }

  async function create() {
    if (!title.trim() || !prompt.trim()) return;
    if (!live) {
      toast("info", "Sign in to create real campaigns. (Sample data)");
      return;
    }
    setCreating(true);
    try {
      await createCampaign({ title, prompt, cadence, hourLocal: hour });
      setLiveCampaigns(await getCampaigns());
      setTitle("");
      setPrompt("");
      toast("success", "Campaign saved — the scheduler picks it up within a minute of its hour.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Couldn't save the campaign.");
    }
    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Campaigns"
        sub="Standing missions on a schedule. Reports land here; ideas land in the Studio."
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
                    Built in
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
              {CADENCE_LABEL[c.cadence]}
              {c.cadence !== "manual" && ` at ${String(c.hourLocal).padStart(2, "0")}:00 UTC`}
              {c.lastRunAt && ` · last ran ${fmtDate(c.lastRunAt.slice(0, 10))}`}
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
                  Latest report
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
                {running === c.id ? "Running…" : "Run now"}
              </button>
              {live && !c.builtIn && (
                <button
                  onClick={() => remove(c)}
                  className="btn-ghost px-3.5 py-1.5 text-xs hover:text-critical"
                >
                  Delete
                </button>
              )}
            </div>
          </Card>
        ))}

        <Card title="New campaign">
          <p className="text-xs leading-relaxed text-ink-muted">
            Write a standing mission in plain English — “every Friday, find
            angles for a newsletter CTA post from what moved this week.”
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="mt-3 w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
          />
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Every …"
            className="mt-2 w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink placeholder:text-ink-muted"
          />
          <div className="mt-2 flex gap-2">
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as Campaign["cadence"])}
              className="flex-1 rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink"
            >
              <option value="manual">Run manually</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
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
            {creating ? "Saving…" : "Create campaign"}
          </button>
        </Card>
      </div>
    </div>
  );
}
