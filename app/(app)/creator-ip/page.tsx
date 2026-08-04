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

const ARC_STYLES: Record<string, string> = {
  seed: "bg-wash-2 text-ink-muted",
  running: "bg-accent/15 text-accent",
  resolved: "bg-good/10 text-good",
};

const ARC_LABEL: Record<string, string> = {
  seed: "准备中",
  running: "持续更新",
  resolved: "已完成",
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
      toast("success", `已把 v${version} 恢复为最新版本，请检查后重新启用。`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "恢复失败。" );
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
      toast("success", "内容档案已经整理完成，请检查后再启用。" );
    } catch {
      toast("info", "服务暂时不可用，目前保留演示数据。" );
    }
    setInterpreting(false);
  }

  async function bless() {
    if (!signedIn) {
      toast("info", "登录后可以启用自己的内容档案。（演示数据）" );
      return;
    }
    if (activating) return;
    setActivating(true);
    try {
      await activate();
      await refresh();
      toast("success", "内容档案已启用，PostPilot 会按照这份资料工作。" );
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "启用失败。" );
    }
    setActivating(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="内容档案"
        sub="把你的经历、表达方式和内容方向整理成长期使用的资料。确认并启用前，产品不会根据它生成内容。"
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Interview */}
        <div className="flex flex-col gap-5">
          <Card title="介绍你自己">
            <p className="text-xs leading-relaxed text-ink-muted">
              你是谁，希望因为什么被记住，又有哪些亲身经历可以分享？像平时说话一样写下来，产品会把它整理成右侧的内容档案。
            </p>
            <textarea
              rows={7}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="我是……我希望大家因为……记住我。我的经历是……我平时说话的方式是……"
              className="mt-3 w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink placeholder:text-ink-muted"
            />
            <button
              onClick={interpret}
              disabled={interpreting}
              className="btn-primary mt-3 w-full px-3.5 py-2 text-sm"
            >
              {interpreting ? "正在整理…" : "整理我的内容档案"}
            </button>
          </Card>

          <Card title="档案状态">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-2">当前版本</span>
              <span className="rounded-full bg-wash-2 px-2.5 py-0.5 text-xs font-semibold">
                v{p.version}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-ink-2">更新时间</span>
              <span className="text-xs text-ink-muted">{fmtDate(p.updatedAt)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-ink-2">是否启用</span>
              <span className={`text-xs font-medium ${activated ? "text-good" : "text-accent"}`}>
                {activated ? "已由你确认" : "尚未启用"}
              </span>
            </div>
            <button
              onClick={bless}
              disabled={activating}
              className={`mt-4 w-full px-3.5 py-2 text-sm ${activated ? "btn-ghost" : "btn-primary"}`}
            >
              {activating
                ? "正在启用…"
                : activated
                  ? "修改后重新启用"
                  : "确认并启用"}
            </button>
            {!activated && (
              <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                只有你确认并启用后，产品才会按照这份档案生成内容。
              </p>
            )}
          </Card>

          {signedIn && versions.length > 0 && (
            <Card title="版本记录">
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
                        恢复此版本
                      </button>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
                      {v.profile.positioning || "（空白档案）"}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-ink-muted">
                旧版本不会被覆盖；恢复后会生成一个新版本。
              </p>
            </Card>
          )}
        </div>

        {/* Brand book */}
        <div className="flex flex-col gap-5">
          {empty && (
            <Card>
              <p className="font-display text-[17px] leading-[28px] text-ink">
                你的内容档案还是空白。请在左侧介绍自己，检查整理结果后再启用。
              </p>
            </Card>
          )}
          <Card title="内容定位">
            <p className="font-display text-[19px] leading-[30px] text-ink">
              {p.positioning}
            </p>
            <p className="mt-3 text-xs text-ink-muted">{p.audience}</p>
          </Card>

          <Card title="主要内容方向">
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

          <Card title="个人背景">
            <p className="text-sm leading-relaxed text-ink-2">{p.backgroundMd}</p>
          </Card>

          <Card title="长期故事线">
            <ul className="flex flex-col gap-2.5">
              {p.narratives.map((n) => (
                <li key={n.title} className="rounded-xl bg-surface-2 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{n.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ARC_STYLES[n.status]}`}
                    >
                      {ARC_LABEL[n.status] ?? n.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{n.arc}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="表达方式">
            <p className="text-sm italic text-ink-2">{p.voice.tone}</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-good">建议这样写</h3>
                <ul className="mt-1.5 flex flex-col gap-1 text-sm text-ink-2">
                  {p.voice.do.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-critical">避免这样写</h3>
                <ul className="mt-1.5 flex flex-col gap-1 text-sm text-ink-2">
                  {p.voice.dont.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
              </div>
            </div>
            {p.voice.catchphrases.length > 0 && (
              <p className="mt-3 text-xs text-ink-muted">
                常用表达：{p.voice.catchphrases.map((c) => `“${c}”`).join(" · ")}
              </p>
            )}
          </Card>

          {(p.lessons?.length ?? 0) > 0 && (
            <Card title="长期写作要求">
              <p className="mb-2 text-xs text-ink-muted">
                这些要求来自你确认采用的建议，之后每次生成内容都会参考。
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
