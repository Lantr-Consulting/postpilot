"use client";

import { useEffect, useState } from "react";
import {
  activate,
  getVersions,
  interpretProfile,
  restoreVersion,
  type ProfileVersion,
} from "@/lib/api";
import { useMe } from "@/lib/use-me";
import { CREATOR } from "@/lib/mock";
import type { IpProfile } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, SectionHeading } from "@/components/ui";
import { pick, useLanguage } from "@/lib/language";

const ARC_STYLES: Record<string, string> = {
  seed: "bg-wash-2 text-ink-muted",
  running: "bg-accent/15 text-accent",
  resolved: "bg-good/10 text-good",
};

const ARC_LABEL: Record<string, { zh: string; en: string }> = {
  seed: { zh: "准备中", en: "Seed" },
  running: { zh: "持续更新", en: "Running" },
  resolved: { zh: "已完成", en: "Resolved" },
};

export default function CreatorIpPage() {
  const toast = useToast();
  const language = useLanguage();
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

  // Version history — every interpretation, restore, and accepted review
  // move leaves a snapshot behind.
  const [versions, setVersions] = useState<ProfileVersion[]>([]);
  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    getVersions().then((v) => alive && setVersions(v)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [signedIn, p.version]);

  async function restore(version: number) {
    try {
      await restoreVersion(version);
      await refresh();
      toast("success", pick(language, `已把 v${version} 恢复为最新版本，请检查后重新启用。`, `Version ${version} is now the latest draft. Review it, then reactivate.`));
    } catch (e) {
      toast("error", e instanceof Error ? e.message : pick(language, "恢复失败。", "Restore failed."));
    }
  }

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
      toast("success", pick(language, "内容档案已经整理完成，请检查后再启用。", "Your content profile is ready. Review it before activating."));
    } catch {
      toast("info", pick(language, "服务暂时不可用，目前保留演示数据。", "The service is temporarily unavailable, so the demo profile remains in place."));
    }
    setInterpreting(false);
  }

  async function bless() {
    if (!signedIn) {
      toast("info", pick(language, "登录后可以启用自己的内容档案。（演示数据）", "Sign in to activate your own content profile. (Demo data)"));
      return;
    }
    if (activating) return;
    setActivating(true);
    try {
      await activate();
      await refresh();
      toast("success", pick(language, "内容档案已启用，PostPilot 会按照这份资料工作。", "Content profile activated. PostPilot will now work from it."));
    } catch (e) {
      toast("error", e instanceof Error ? e.message : pick(language, "启用失败。", "Activation failed."));
    }
    setActivating(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title={pick(language, "内容档案", "Content profile")}
        sub={pick(language, "把你的经历、表达方式和内容方向整理成长期使用的资料。确认并启用前，产品不会根据它生成内容。", "Turn your story, voice, and content direction into a living profile. Nothing uses it until you review and activate it.")}
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Interview */}
        <div className="flex flex-col gap-5">
          <Card title={pick(language, "介绍你自己", "Tell us about yourself")}>
            <p className="text-xs leading-relaxed text-ink-muted">
              {pick(language, "你是谁，希望因为什么被记住，又有哪些亲身经历可以分享？像平时说话一样写下来，产品会把它整理成右侧的内容档案。", "Who are you, what do you want to be known for, and which lived experiences can you share? Write naturally; PostPilot will organize it into the profile on the right.")}
            </p>
            <textarea
              rows={7}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder={pick(language, "我是……我希望大家因为……记住我。我的经历是……我平时说话的方式是……", "I am… I want to be known for… My background is… The way I speak is…")}
              className="mt-3 w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink placeholder:text-ink-muted"
            />
            <button
              onClick={interpret}
              disabled={interpreting}
              className="btn-primary mt-3 w-full px-3.5 py-2 text-sm"
            >
              {interpreting ? pick(language, "正在整理…", "Organizing…") : pick(language, "整理我的内容档案", "Build my content profile")}
            </button>
          </Card>

          <Card title={pick(language, "档案状态", "Profile status")}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-2">{pick(language, "当前版本", "Current version")}</span>
              <span className="rounded-full bg-wash-2 px-2.5 py-0.5 text-xs font-semibold">
                v{p.version}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-ink-2">{pick(language, "更新时间", "Updated")}</span>
              <span className="text-xs text-ink-muted">{fmtDate(p.updatedAt, language)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-ink-2">{pick(language, "是否启用", "Activation")}</span>
              <span className={`text-xs font-medium ${activated ? "text-good" : "text-accent"}`}>
                {activated ? pick(language, "已由你确认", "Confirmed by you") : pick(language, "尚未启用", "Not active")}
              </span>
            </div>
            <button
              onClick={bless}
              disabled={activating}
              className={`mt-4 w-full px-3.5 py-2 text-sm ${activated ? "btn-ghost" : "btn-primary"}`}
            >
              {activating
                ? pick(language, "正在启用…", "Activating…")
                : activated
                  ? pick(language, "修改后重新启用", "Reactivate after edits")
                  : pick(language, "确认并启用", "Confirm and activate")}
            </button>
            {!activated && (
              <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                {pick(language, "只有你确认并启用后，产品才会按照这份档案生成内容。", "PostPilot only generates from this profile after you confirm and activate it.")}
              </p>
            )}
          </Card>

          {signedIn && versions.length > 0 && (
            <Card title={pick(language, "版本记录", "Version history")}>
              <ul className="flex flex-col gap-2">
                {versions.map((v) => (
                  <li key={v.version} className="rounded-xl bg-surface-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">
                        v{v.version}
                        <span className="ml-1.5 font-normal text-ink-muted">
                          {v.createdAt}
                        </span>
                      </span>
                      <button
                        onClick={() => restore(v.version)}
                        className="btn-ghost px-2.5 py-1 text-[11px]"
                      >
                        {pick(language, "恢复此版本", "Restore")}
                      </button>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
                      {v.profile.positioning || pick(language, "（空白档案）", "(blank profile)")}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-ink-muted">
                {pick(language, "旧版本不会被覆盖；恢复后会生成一个新版本。", "Old versions are never overwritten; restoring creates a new version.")}
              </p>
            </Card>
          )}
        </div>

        {/* Brand book */}
        <div className="flex flex-col gap-5">
          {empty && (
            <Card>
              <p className="font-display text-[17px] leading-[28px] text-ink">
                {pick(language, "你的内容档案还是空白。请在左侧介绍自己，检查整理结果后再启用。", "Your content profile is blank. Introduce yourself on the left, review the result, then activate it.")}
              </p>
            </Card>
          )}
          <Card title={pick(language, "内容定位", "Positioning")}>
            <p className="font-display text-[19px] leading-[30px] text-ink">
              {p.positioning}
            </p>
            <p className="mt-3 text-xs text-ink-muted">{p.audience}</p>
          </Card>

          <Card title={pick(language, "主要内容方向", "Content pillars")}>
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

          <Card title={pick(language, "个人背景", "Background")}>
            <p className="text-sm leading-relaxed text-ink-2">{p.backgroundMd}</p>
          </Card>

          <Card title={pick(language, "长期故事线", "Narrative arcs")}>
            <ul className="flex flex-col gap-2.5">
              {p.narratives.map((n) => (
                <li key={n.title} className="rounded-xl bg-surface-2 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{n.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ARC_STYLES[n.status]}`}
                    >
                      {ARC_LABEL[n.status]?.[language] ?? n.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{n.arc}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={pick(language, "表达方式", "Voice")}>
            <p className="text-sm italic text-ink-2">{p.voice.tone}</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-good">{pick(language, "建议这样写", "Do")}</h3>
                <ul className="mt-1.5 flex flex-col gap-1 text-sm text-ink-2">
                  {p.voice.do.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-critical">{pick(language, "避免这样写", "Avoid")}</h3>
                <ul className="mt-1.5 flex flex-col gap-1 text-sm text-ink-2">
                  {p.voice.dont.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
              </div>
            </div>
            {p.voice.catchphrases.length > 0 && (
              <p className="mt-3 text-xs text-ink-muted">
                {pick(language, "常用表达：", "Signature phrases: ")}{p.voice.catchphrases.map((c) => `“${c}”`).join(" · ")}
              </p>
            )}
          </Card>

          {(p.lessons?.length ?? 0) > 0 && (
            <Card title={pick(language, "长期写作要求", "Standing instructions")}>
              <p className="mb-2 text-xs text-ink-muted">
                {pick(language, "这些要求来自你确认采用的建议，之后每次生成内容都会参考。", "These instructions come from recommendations you accepted and apply to future drafts.")}
              </p>
              <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
                {p.lessons!.map((l) => (
                  <li key={l} className="index-card rounded-lg px-3 py-2">
                    {l}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
