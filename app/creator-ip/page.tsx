"use client";

import { useState } from "react";
import { activate, interpretProfile } from "@/lib/api";
import { useMe } from "@/lib/use-me";
import { CREATOR } from "@/lib/mock";
import type { IpProfile } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, SectionHeading } from "@/components/ui";

const ARC_STYLES: Record<string, string> = {
  seed: "bg-wash-2 text-ink-muted",
  running: "bg-accent/15 text-accent",
  resolved: "bg-good/10 text-good",
};

export default function CreatorIpPage() {
  const toast = useToast();
  const { me, refresh } = useMe();
  // Signed out, the brand book is client state over the demo creator.
  const [localProfile, setLocalProfile] = useState<IpProfile>(CREATOR.ipProfile);
  const [story, setStory] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [activating, setActivating] = useState(false);

  const signedIn = me !== null;
  const p = signedIn ? me.ipProfile : localProfile;
  const activated = signedIn ? me.activated : CREATOR.activated;
  const empty = signedIn && !p.positioning;

  async function interpret() {
    if (interpreting || !story.trim()) return;
    setInterpreting(true);
    try {
      const { profile: fresh } = await interpretProfile(story);
      if (signedIn) {
        // The server saved it as the next (inactive) version.
        await refresh();
      } else {
        setLocalProfile((old) => ({
          ...fresh,
          goals: fresh.goals?.length ? fresh.goals : old.goals,
          version: old.version + 1,
          updatedAt: new Date().toISOString().slice(0, 10),
        }));
      }
      toast("success", "Interpreted — review the brand book, then Activate.");
    } catch {
      toast("info", "Backend offline — this stays sample data for now.");
    }
    setInterpreting(false);
  }

  async function bless() {
    if (!signedIn) {
      toast("info", "Sign in to activate your own Creator IP. (Sample data)");
      return;
    }
    if (activating) return;
    setActivating(true);
    try {
      await activate();
      await refresh();
      toast("success", "Activated — PostPilot now works from this brand book.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Activation failed.");
    }
    setActivating(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Creator IP"
        sub="Your story in plain English → an interpreted, versioned brand book. Nothing generates until you activate it."
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Interview */}
        <div className="flex flex-col gap-5">
          <Card title="Tell it your story">
            <p className="text-xs leading-relaxed text-ink-muted">
              Who are you, what do you want to be known for, what stories are
              you carrying? Write like you talk — the agent interprets it into
              the brand book on the right.
            </p>
            <textarea
              rows={7}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="I'm a … and I want to be known for … My story is … I talk like …"
              className="mt-3 w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink placeholder:text-ink-muted"
            />
            <button
              onClick={interpret}
              disabled={interpreting}
              className="btn-primary mt-3 w-full px-3.5 py-2 text-sm"
            >
              {interpreting ? "Interpreting…" : "Interpret my story"}
            </button>
          </Card>

          <Card title="Status">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-2">Profile version</span>
              <span className="rounded-full bg-wash-2 px-2.5 py-0.5 text-xs font-semibold">
                v{p.version}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-ink-2">Updated</span>
              <span className="text-xs text-ink-muted">{fmtDate(p.updatedAt)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-ink-2">Active</span>
              <span className={`text-xs font-medium ${activated ? "text-good" : "text-accent"}`}>
                {activated ? "Yes — blessed by you" : "Not yet"}
              </span>
            </div>
            <button
              onClick={bless}
              disabled={activating}
              className={`mt-4 w-full px-3.5 py-2 text-sm ${activated ? "btn-ghost" : "btn-primary"}`}
            >
              {activating
                ? "Activating…"
                : activated
                  ? "Re-activate after edits"
                  : "Activate"}
            </button>
            {!activated && (
              <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                Nothing generates until you bless the brand book — the agent
                works only from what you&apos;ve approved.
              </p>
            )}
          </Card>
        </div>

        {/* Brand book */}
        <div className="flex flex-col gap-5">
          {empty && (
            <Card>
              <p className="font-display text-[17px] leading-[28px] text-ink">
                Your brand book is blank. Tell PostPilot your story on the
                left — it interprets, you review, and nothing runs until you
                activate.
              </p>
            </Card>
          )}
          <Card title="Positioning">
            <p className="font-display text-[19px] leading-[30px] text-ink">
              {p.positioning}
            </p>
            <p className="mt-3 text-xs text-ink-muted">{p.audience}</p>
          </Card>

          <Card title="Pillars">
            <div className="flex flex-wrap gap-2">
              {p.pillars.map((pillar) => (
                <span
                  key={pillar}
                  className="rounded-full bg-surface-2 px-3.5 py-1.5 text-sm text-ink-2"
                >
                  {pillar}
                </span>
              ))}
            </div>
          </Card>

          <Card title="Background">
            <p className="text-sm leading-relaxed text-ink-2">{p.backgroundMd}</p>
          </Card>

          <Card title="Narrative arcs">
            <ul className="flex flex-col gap-2.5">
              {p.narratives.map((n) => (
                <li key={n.title} className="rounded-xl bg-surface-2 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{n.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ARC_STYLES[n.status]}`}
                    >
                      {n.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{n.arc}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Voice">
            <p className="text-sm italic text-ink-2">{p.voice.tone}</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-good">Do</h3>
                <ul className="mt-1.5 flex flex-col gap-1 text-sm text-ink-2">
                  {p.voice.do.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-critical">Don&apos;t</h3>
                <ul className="mt-1.5 flex flex-col gap-1 text-sm text-ink-2">
                  {p.voice.dont.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
              </div>
            </div>
            {p.voice.catchphrases.length > 0 && (
              <p className="mt-3 text-xs text-ink-muted">
                Catchphrases: {p.voice.catchphrases.map((c) => `“${c}”`).join(" · ")}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
