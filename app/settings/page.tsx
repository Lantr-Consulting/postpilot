"use client";

import { useState } from "react";
import { CREATOR } from "@/lib/mock";
import { PLATFORM_LABEL, type Platform } from "@/lib/types";
import { useToast } from "@/components/toast";
import { Card, SectionHeading } from "@/components/ui";

const ALL_PLATFORMS: Platform[] = ["x", "linkedin", "instagram", "bluesky", "youtube"];

export default function SettingsPage() {
  const toast = useToast();
  const [platforms, setPlatforms] = useState<Platform[]>(CREATOR.platforms);
  const [banned, setBanned] = useState(CREATOR.editorialRules.bannedPhrases);
  const [newPhrase, setNewPhrase] = useState("");
  const [paused, setPaused] = useState(CREATOR.paused);

  function togglePlatform(p: Platform) {
    setPlatforms((ps) =>
      ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]
    );
    toast("info", "Saved — drafts are tailored to your enabled platforms.");
  }

  function addPhrase() {
    const phrase = newPhrase.trim().toLowerCase();
    if (!phrase || banned.includes(phrase)) return;
    setBanned((b) => [...b, phrase]);
    setNewPhrase("");
    toast("success", `"${phrase}" banned — the engine enforces it, not the prompt.`);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Settings"
        sub="You own every rule. The editorial engine enforces what you bless — in code, not in the prompt."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Editorial rules">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Banned phrases
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {banned.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setBanned((b) => b.filter((x) => x !== p));
                  toast("info", `"${p}" un-banned.`);
                }}
                title="Click to remove"
                className="group rounded-full bg-surface-2 px-3 py-1 text-xs text-ink-2 hover:bg-critical/15 hover:text-critical"
              >
                {p} <span className="text-ink-muted group-hover:text-critical">×</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPhrase()}
              placeholder="Add a phrase to ban…"
              className="flex-1 rounded-full border border-hairline bg-page px-3.5 py-1.5 text-xs text-ink placeholder:text-ink-muted"
            />
            <button onClick={addPhrase} className="btn-ghost px-3.5 py-1.5 text-xs">
              Ban it
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-hairline pt-4 text-sm">
            <div>
              <div className="text-xs text-ink-muted">Sponsored tag</div>
              <div className="mt-1 font-semibold">
                {CREATOR.editorialRules.sponsoredDisclosure}
              </div>
              <div className="mt-0.5 text-[10px] text-ink-muted">16 CFR 255</div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">Max hashtags</div>
              <div className="mt-1 font-semibold">
                {CREATOR.editorialRules.maxHashtags}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">Max emoji</div>
              <div className="mt-1 font-semibold">
                {CREATOR.editorialRules.maxEmoji}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card title="Platforms">
            <p className="text-xs text-ink-muted">
              Every approved idea gets a tailored variant per enabled platform.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {ALL_PLATFORMS.map((p) => {
                const on = platforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                      on ? "bg-surface-2 text-ink" : "bg-surface-2/40 text-ink-muted"
                    }`}
                  >
                    {PLATFORM_LABEL[p]}
                    <span
                      className={`text-xs font-medium ${on ? "text-good" : "text-ink-muted"}`}
                    >
                      {on ? "On" : "Off"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="LLM key">
            <p className="text-xs leading-relaxed text-ink-muted">
              Bring your own key, or use the shared demo brain. Keys live in
              your account only — never in code, never on GitHub.
            </p>
            <input
              type="password"
              placeholder="sk-… (arrives with accounts at Milestone 5)"
              disabled
              className="mt-3 w-full rounded-lg border border-hairline bg-page px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted disabled:opacity-50"
            />
          </Card>

          <Card title="Kill switch">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-ink-muted">
                Pause everything: no runs, no campaigns, no drafts. Your data
                stays put.
              </p>
              <button
                role="switch"
                aria-checked={paused}
                onClick={() => {
                  setPaused(!paused);
                  toast(paused ? "success" : "info", paused ? "Resumed." : "Paused — all agent activity stops.");
                }}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  paused ? "bg-critical" : "bg-wash-2"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-page transition-transform ${
                    paused ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
