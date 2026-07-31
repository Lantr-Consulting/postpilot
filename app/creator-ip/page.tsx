"use client";

import { useState } from "react";
import { interpretProfile } from "@/lib/api";
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
  // The interpreted brand book is client state until Supabase (M5).
  const [profile, setProfile] = useState<IpProfile>(CREATOR.ipProfile);
  const [story, setStory] = useState(
    "I'm a physical therapist turned online strength coach. I want to be the person people think of for evidence-based minimalist training — three good hours a week…"
  );
  const [interpreting, setInterpreting] = useState(false);
  const p = profile;

  async function interpret() {
    if (interpreting || !story.trim()) return;
    setInterpreting(true);
    try {
      const { profile: fresh } = await interpretProfile(story);
      setProfile((old) => ({
        ...fresh,
        // Keep goals if the model found none — a thin story shouldn't wipe them.
        goals: fresh.goals.length ? fresh.goals : old.goals,
        version: old.version + 1,
        updatedAt: new Date().toISOString().slice(0, 10),
      }));
      toast("success", "Interpreted — review the brand book, then Activate.");
    } catch {
      toast("info", "Backend offline — this stays sample data for now.");
    }
    setInterpreting(false);
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
              className="mt-3 w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink"
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
              <span className={`text-xs font-medium ${CREATOR.activated ? "text-good" : "text-accent"}`}>
                {CREATOR.activated ? "Yes — blessed by you" : "Not yet"}
              </span>
            </div>
            <button
              onClick={() =>
                toast("info", "Already active. Edits create a new version to review.")
              }
              className="btn-ghost mt-4 w-full px-3.5 py-2 text-sm"
            >
              {CREATOR.activated ? "Re-activate after edits" : "Activate"}
            </button>
          </Card>
        </div>

        {/* Brand book */}
        <div className="flex flex-col gap-5">
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
