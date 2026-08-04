"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { patchSettings } from "@/lib/api";
import { useMe } from "@/lib/use-me";
import { CREATOR } from "@/lib/mock";
import { PLATFORM_LABEL, type Platform } from "@/lib/types";
import { useToast } from "@/components/toast";
import { Card, SectionHeading } from "@/components/ui";

const ALL_PLATFORMS: Platform[] = ["x", "linkedin", "instagram", "bluesky", "youtube"];

export default function SettingsPage() {
  const toast = useToast();
  const { me } = useMe();
  const [platforms, setPlatforms] = useState<Platform[]>(CREATOR.platforms);
  const [banned, setBanned] = useState(CREATOR.editorialRules.bannedPhrases);
  const [newPhrase, setNewPhrase] = useState("");
  const [paused, setPaused] = useState(CREATOR.paused);

  // Signed in: your saved rules replace the demo creator's. (Deferred a
  // frame per the React compiler's no-sync-setState-in-effect rule.)
  useEffect(() => {
    if (!me) return;
    const id = requestAnimationFrame(() => {
      setPlatforms(me.platforms);
      setBanned(me.editorialRules.bannedPhrases);
      setPaused(me.paused);
    });
    return () => cancelAnimationFrame(id);
  }, [me]);

  function save(fields: Parameters<typeof patchSettings>[0]) {
    if (!me) return;
    patchSettings(fields).catch(() =>
      toast("error", "保存失败，请稍后重试。" )
    );
  }

  function togglePlatform(p: Platform) {
    const next = platforms.includes(p)
      ? platforms.filter((x) => x !== p)
      : [...platforms, p];
    setPlatforms(next);
    save({ platforms: next });
    toast("info", "已保存，之后会为启用的平台分别准备初稿。" );
  }

  function addPhrase() {
    const phrase = newPhrase.trim().toLowerCase();
    if (!phrase || banned.includes(phrase)) return;
    const next = [...banned, phrase];
    setBanned(next);
    setNewPhrase("");
    save({
      editorialRules: {
        ...(me?.editorialRules ?? CREATOR.editorialRules),
        bannedPhrases: next,
      },
    });
    toast("success", `已禁用“${phrase}”，发布前检查会自动识别。`);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="设置"
        sub="你可以决定哪些平台需要初稿、哪些表达不能出现，以及什么时候暂停所有任务。"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="内容检查规则">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            禁用表达
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {banned.map((p) => (
              <button
                key={p}
                onClick={() => {
                  const next = banned.filter((x) => x !== p);
                  setBanned(next);
                  save({
                    editorialRules: {
                      ...(me?.editorialRules ?? CREATOR.editorialRules),
                      bannedPhrases: next,
                    },
                  });
                  toast("info", `已允许使用“${p}”。`);
                }}
                title="点击移除"
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
              placeholder="添加不希望出现的表达…"
              className="flex-1 rounded-full border border-hairline bg-page px-3.5 py-1.5 text-xs text-ink placeholder:text-ink-muted"
            />
            <button onClick={addPhrase} className="btn-ghost px-3.5 py-1.5 text-xs">
              添加
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-hairline pt-4 text-sm">
            <div>
              <div className="text-xs text-ink-muted">推广内容标记</div>
              <div className="mt-1 font-semibold">
                {CREATOR.editorialRules.sponsoredDisclosure}
              </div>
              <div className="mt-0.5 text-[10px] text-ink-muted">16 CFR 255</div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">最多话题标签</div>
              <div className="mt-1 font-semibold">
                {CREATOR.editorialRules.maxHashtags}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">最多表情符号</div>
              <div className="mt-1 font-semibold">
                {CREATOR.editorialRules.maxEmoji}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card title="发布平台">
            <p className="text-xs text-ink-muted">
              采用选题后，产品会按照已启用平台的格式分别准备初稿。当前版本面向国际内容平台，所有内容都由用户自行发布。
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
                      {on ? "已启用" : "未启用"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="更多工具">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["/creator-ip", "内容档案", "管理个人经历、表达方式和内容方向"],
                ["/growth-lead", "内容顾问", "讨论选题并查看定期回顾"],
                ["/campaigns", "定时任务", "安排定期研究和内容准备"],
                ["/performance", "内容表现", "记录发布结果并回顾哪些内容有效"],
              ].map(([href, title, body]) => (
                <Link key={href} href={href} className="rounded-xl bg-surface-2 p-3 transition-colors hover:bg-wash-2">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink-muted">{body}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="暂停所有任务">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-ink-muted">
                暂停后不会继续研究、运行定时任务或生成初稿，已有数据会保留。
              </p>
              <button
                role="switch"
                aria-checked={paused}
                onClick={() => {
                  setPaused(!paused);
                  save({ paused: !paused });
                  toast(paused ? "success" : "info", paused ? "任务已恢复。" : "所有自动任务已暂停。" );
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
