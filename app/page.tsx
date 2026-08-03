"use client";

/* Marketing landing at "/" — FORGE design language (matching lantr.site),
   bilingual EN/中文. The product lives behind it under /today etc. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ColumnRules,
  LangToggle,
  persistLang,
  readLang,
  Reveal,
  Words,
  type Lang,
} from "@/components/landing/kit";

const COPY = {
  en: {
    nav: { features: "Features", how: "How it works", who: "Who it's for" },
    hub: "All demos",
    signIn: "Sign in",
    openApp: "Open the demo",
    openDash: "Open your studio",
    badge: "A Lantr sample project · Export-only, you press publish",
    h1: "A growth lead that actually knows your story.",
    subLead: "It studies your background, your narratives, your raw materials, ",
    subEm: "then writes like you",
    subRest:
      " — building a versioned brand book and drafting posts that cite your own words. You approve, you export, you press publish.",
    ctaPrimary: "Explore the live demo",
    ctaSecondary: "Create a free account",
    trust: [
      "Never invents your stories — every draft cites your material",
      "An editorial engine enforces FTC disclosure & platform rules",
      "Export-only: the human is the actuator",
    ],
    frameCaption: "Export-only — you press publish.",
    featuresKicker: "What it does",
    featuresTitle: "A growth lead, not a caption generator.",
    features: [
      {
        t: "A versioned brand book",
        b: "Your voice, your story arcs, your positioning — kept in a living document with full version history and restore.",
      },
      {
        t: "A library it mines, not imagines",
        b: "Upload transcripts, notes, old posts. The agent mines them into tagged content atoms — and every draft must cite them.",
      },
      {
        t: "Editorial rules in code",
        b: "FTC 16 CFR 255 disclosure, platform limits, banned phrases, duplicate detection — cited rules enforced deterministically, not by the model's goodwill.",
      },
      {
        t: "A radar for your niche",
        b: "Live signals from Bluesky, Reddit, Google News, and Google Trends shape ideas that actually fit your lane.",
      },
      {
        t: "Growth reviews",
        b: "It proposes strategy moves on a cadence; every move you accept is written back into the brand book as a lesson.",
      },
      {
        t: "Campaigns while you're away",
        b: "Scheduled research and drafting runs. When you come back, drafts are queued and waiting for review.",
      },
    ],
    howKicker: "How it works",
    howTitle: "Four steps, one loop.",
    how: [
      {
        t: "Create an account",
        b: "You get a blank growth lead. Nothing activates until the interview is done and approved.",
      },
      {
        t: "Teach it your IP",
        b: "Tell it your background and narratives, upload materials. It drafts your brand book; you approve it.",
      },
      {
        t: "It researches and drafts",
        b: "Ideas cite your atoms; drafts pass every editorial check before they reach you.",
      },
      {
        t: "You approve and export",
        b: "Post it yourself, log the results, and the loop learns — sounding more like you each round.",
      },
    ],
    hoodKicker: "Under the hood",
    hoodTitle: "Built milestone by milestone.",
    hoodBody:
      "First ship, design pass, brain, hands, memory, autonomy — built in the exact order Lantr students build theirs, with every milestone a public tag on GitHub.",
    hoodLink: "Read the source on GitHub",
    whoKicker: "Who it's for",
    whoTitle: "The marketing & media track sample.",
    whoBody:
      "Lantr students build a project aimed at their intended major. This one shows what the marketing-and-media direction looks like when it ships.",
    who: [
      {
        t: "Marketing & Communications",
        b: "Brand strategy, positioning, and an editorial pipeline — built as software, not slideware.",
      },
      {
        t: "Business & Entrepreneurship",
        b: "Creator-economy growth loops: strategy, execution, and results you can measure.",
      },
      {
        t: "Computer Science & AI",
        b: "Context engineering, retrieval without a vector database, and deterministic rule engines around an LLM.",
      },
    ],
    ctaTitle: "Your story, shipped on schedule.",
    ctaBody: "Sign in once and you're signed in across every Lantr demo.",
    footerDisclaimer:
      "Drafts are suggestions — you review, you publish. A Lantr sample project.",
    footerLinks: "More from Lantr",
  },
  zh: {
    nav: { features: "功能", how: "运作方式", who: "适合谁" },
    hub: "全部演示",
    signIn: "登录",
    openApp: "进入演示",
    openDash: "打开我的工作室",
    badge: "Lantr 示范项目 · 仅导出，发布权在你",
    h1: "一位真正懂你故事的 AI 增长负责人。",
    subLead: "它研读你的背景、你的叙事、你的原始素材，",
    subEm: "然后像你一样落笔",
    subRest:
      "——沉淀出带版本管理的品牌手册，每篇草稿都引用你亲口说过的话。你来审核、你来导出，发布键永远在你手里。",
    ctaPrimary: "进入在线演示",
    ctaSecondary: "免费创建账户",
    trust: [
      "绝不虚构你的故事——每篇草稿都引用你的素材",
      "编辑引擎强制执行 FTC 披露与平台规则",
      "仅导出：人是最终的执行者",
    ],
    frameCaption: "仅导出——发布键在你手里。",
    featuresKicker: "它能做什么",
    featuresTitle: "是增长负责人，不是文案生成器。",
    features: [
      {
        t: "一本带版本的品牌手册",
        b: "你的声音、叙事线和定位，沉淀成一份持续生长的文档——每次修改都有版本记录，随时可以回滚。",
      },
      {
        t: "它挖掘素材，而不是凭空想象",
        b: "上传访谈记录、笔记、旧帖子，它会把素材提炼成带标签的内容原子；每篇草稿都必须引用它们。",
      },
      {
        t: "写进代码的编辑规范",
        b: "FTC 16 CFR 255 广告披露、平台字数限制、违禁词、重复检测——都是有出处的规则，由代码强制执行，而不是靠模型自觉。",
      },
      {
        t: "你所在赛道的雷达",
        b: "来自 Bluesky、Reddit、Google News 与 Google Trends 的实时信号，让每个选题都落在你的赛道上。",
      },
      {
        t: "增长复盘",
        b: "它定期提出策略调整建议；你采纳的每一条，都会作为经验写回品牌手册。",
      },
      {
        t: "你不在时，它照常开工",
        b: "定时执行的研究与起草任务。等你回来时，草稿已经排好队待审。",
      },
    ],
    howKicker: "运作方式",
    howTitle: "四个步骤，一个闭环。",
    how: [
      {
        t: "创建账户",
        b: "你会得到一位空白的增长负责人——完成“面谈”并经你确认后才会激活。",
      },
      {
        t: "教它你的 IP",
        b: "讲述你的背景与叙事，上传素材。它起草品牌手册，经你确认才生效。",
      },
      {
        t: "它研究并起草",
        b: "选题必须引用内容原子，草稿逐条通过编辑引擎检查后才会送到你面前。",
      },
      {
        t: "你审核并导出",
        b: "亲手发布，回填数据，循环学习——每一轮都更像你。",
      },
    ],
    hoodKicker: "技术底层",
    hoodTitle: "按里程碑逐步构建。",
    hoodBody:
      "首次上线、设计打磨、大脑、双手、记忆、自主运行——与 Lantr 学员的构建路径完全一致，每个里程碑都是 GitHub 上公开的 tag。",
    hoodLink: "在 GitHub 阅读源码",
    whoKicker: "适合谁",
    whoTitle: "市场营销与媒体方向的示范作品。",
    whoBody:
      "Lantr 学员会围绕自己的目标专业打造项目。这个项目展示了市场营销与媒体方向做出来是什么样子。",
    who: [
      {
        t: "市场营销与传播",
        b: "品牌策略、定位与编辑流水线——不是 PPT，而是真正跑起来的软件。",
      },
      {
        t: "商业与创业",
        b: "创作者经济的增长闭环：策略、执行、可衡量的结果。",
      },
      {
        t: "计算机与人工智能",
        b: "上下文工程、不用向量数据库的检索，以及围绕 LLM 的确定性规则引擎。",
      },
    ],
    ctaTitle: "你的故事，按时发布。",
    ctaBody: "登录一次，即可通行所有 Lantr 演示项目。",
    footerDisclaimer:
      "草稿只是建议——审核与发布都由你完成。Lantr 示范项目。",
    footerLinks: "更多 Lantr 项目",
  },
} as const;

/* A stylized still of the product — the ink-and-paper desk, kept light. */
function ProductFrame() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--lp-line-strong)] bg-[#f6f4ef] text-left shadow-[0_1px_2px_rgba(30,28,23,0.06),0_40px_80px_-40px_rgba(30,28,23,0.4)]">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-[#211f1a1f] bg-[#efece4] px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#d5d0c4]" />
        <span className="size-2.5 rounded-full bg-[#d5d0c4]" />
        <span className="size-2.5 rounded-full bg-[#d5d0c4]" />
        <span className="lp-mono ml-3 text-[11px] text-[#8d887b]">
          postpilot.lantr.site
        </span>
      </div>
      <div className="grid gap-px bg-[#211f1a14] md:grid-cols-2">
        {/* atom pane — the creator's own words on a ruled index card */}
        <div className="bg-[#f6f4ef] p-5 sm:p-6">
          <div className="lp-mono text-[10px] uppercase tracking-[0.14em] text-[#8d887b]">
            Library · atom #14
          </div>
          <div
            className="mt-3 rounded-xl border border-[#211f1a1f] bg-white p-4"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 27px, #3a55d91a 27px, #3a55d91a 28px)",
            }}
          >
            <p className="lp-display text-[15px] italic leading-[28px] text-[#2c2a24]">
              “The day I benched 315 after my back injury, I cried in my car.
              Not because of the number — because I'd kept a promise to
              myself for 14 months straight.”
            </p>
            <div className="lp-mono mt-3 text-[10px] text-[#8d887b]">
              from “podcast-transcript-march.txt”
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["story", "injury-comeback", "vulnerability"].map((t) => (
              <span
                key={t}
                className="lp-mono rounded-full border border-[#3a55d94d] bg-[#3a55d90d] px-2.5 py-1 text-[10px] text-[#3a55d9]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        {/* draft pane — editorial checks + approve/export */}
        <div className="bg-[#fbfaf7] p-5 sm:p-6">
          <div className="lp-mono text-[10px] uppercase tracking-[0.14em] text-[#8d887b]">
            Draft · LinkedIn · cites atom #14
          </div>
          <div className="mt-3 rounded-xl border border-[#211f1a1f] bg-white p-4">
            <p className="text-[13px] leading-relaxed text-[#2c2a24]">
              Fourteen months ago I couldn't tie my shoes without wincing.
              Yesterday I benched 315. The number isn't the point — the
              promise is. Here's the exact rehab protocol I followed…
            </p>
            <ul className="mt-3 space-y-1.5">
              {[
                ["Platform limit — 3,000 chars", true],
                ["No banned phrases", true],
                ["Atom citation resolves", true],
                ["Sponsored — FTC disclosure added", false],
              ].map(([c, ok]) => (
                <li
                  key={c as string}
                  className={`flex items-center gap-2 text-[11px] ${ok ? "text-[#8d887b]" : "text-[#9a6b1f]"}`}
                >
                  {ok ? (
                    <svg
                      viewBox="0 0 12 12"
                      className="size-3 text-[#3a55d9]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M2 6.5 4.5 9 10 3.5" />
                    </svg>
                  ) : (
                    <span aria-hidden className="lp-mono text-[11px] text-[#c2841f]">
                      ⚠
                    </span>
                  )}
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex flex-1 items-center justify-center rounded-full bg-[#3a55d9] px-3 py-1.5 text-[12px] font-semibold text-white">
                Approve
              </span>
              <span className="inline-flex flex-1 items-center justify-center rounded-full border border-[#211f1a2b] px-3 py-1.5 text-[12px] font-medium text-[#54514a]">
                Export
              </span>
            </div>
          </div>
          <p className="lp-mono mt-3 text-[10px] leading-relaxed text-[#a09b8d]">
            You post it. You own it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [lang, setLang] = useState<Lang>("en");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setLang(readLang());
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
    });
  }, []);

  function switchLang(l: Lang) {
    setLang(l);
    persistLang(l);
  }

  const c = COPY[lang];

  return (
    <div className="forge min-h-screen">
      {/* ── nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--lp-line)] bg-[color-mix(in_oklab,var(--lp-bg)_86%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-5 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="PostPilot" className="size-8 rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight text-[var(--lp-fg)]">
              PostPilot
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-5 text-sm text-[var(--lp-muted)] md:flex">
            <a href="#features" className="transition-colors hover:text-[var(--lp-fg)]">
              {c.nav.features}
            </a>
            <a href="#how" className="transition-colors hover:text-[var(--lp-fg)]">
              {c.nav.how}
            </a>
            <a href="#who" className="transition-colors hover:text-[var(--lp-fg)]">
              {c.nav.who}
            </a>
            <a
              href="https://lantr.site"
              className="transition-colors hover:text-[var(--lp-fg)]"
            >
              {c.hub} ↗
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <LangToggle lang={lang} onChange={switchLang} />
            {signedIn ? (
              <Link href="/today" className="lp-btn h-9 px-4 text-[13px]">
                {c.openDash}
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="lp-btn-ghost hidden h-9 px-4 text-[13px] sm:inline-flex"
                >
                  {c.signIn}
                </Link>
                <Link href="/today" className="lp-btn h-9 px-4 text-[13px]">
                  {c.openApp}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <ColumnRules />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24">
          <Reveal>
            <span className="lp-mono inline-flex items-center gap-2 rounded-full border border-[var(--lp-line-strong)] bg-[var(--lp-surface)] px-4 py-2 text-[11px] font-medium text-[var(--lp-muted)]">
              <span aria-hidden className="size-1.5 rounded-full bg-[var(--lp-accent)]" />
              {c.badge}
            </span>
          </Reveal>
          <h1 className="lp-display mx-auto mt-7 max-w-3xl text-balance text-[2.5rem] font-normal leading-[1.07] tracking-[-0.015em] text-[var(--lp-fg)] sm:text-[3.9rem]">
            <Words text={c.h1} delay={120} />
          </h1>
          <Reveal delay={200}>
            <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-relaxed text-[var(--lp-muted)] sm:text-lg">
              {c.subLead}
              <em className="lp-display italic text-[var(--lp-ink)]">{c.subEm}</em>
              {c.subRest}
            </p>
          </Reveal>
          <Reveal delay={280}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/today" className="lp-btn h-12 px-6 text-[15px]">
                {c.ctaPrimary} →
              </Link>
              <Link href="/signin" className="lp-btn-ghost h-12 px-6 text-[15px]">
                {c.ctaSecondary}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[13px] text-[var(--lp-muted)]">
              {c.trust.map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--lp-accent)]" />
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={440} className="mx-auto mt-12 max-w-4xl">
            <ProductFrame />
            <p className="lp-mono mt-3 text-[11px] text-[var(--lp-faint)]">
              {c.frameCaption}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── features ─────────────────────────────────────── */}
      <section id="features" className="border-t border-[var(--lp-line)] bg-[var(--lp-bg2)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <Reveal>
            <div className="lp-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--lp-accent)]">
              {c.featuresKicker}
            </div>
            <h2 className="lp-display mt-3 max-w-xl text-3xl font-normal tracking-tight text-[var(--lp-fg)] sm:text-4xl">
              {c.featuresTitle}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.map((f, i) => (
              <Reveal key={f.t} delay={i * 70}>
                <div className="lp-card lp-lift h-full rounded-2xl p-6">
                  <div className="lp-mono text-[11px] text-[var(--lp-faint)]">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--lp-fg)]">
                    {f.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">
                    {f.b}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── how it works ─────────────────────────────────── */}
      <section id="how" className="border-t border-[var(--lp-line)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <Reveal>
            <div className="lp-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--lp-accent)]">
              {c.howKicker}
            </div>
            <h2 className="lp-display mt-3 text-3xl font-normal tracking-tight text-[var(--lp-fg)] sm:text-4xl">
              {c.howTitle}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {c.how.map((s, i) => (
              <Reveal key={s.t} delay={i * 90}>
                <div className="relative h-full rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-6">
                  <div className="lp-display text-3xl italic text-[var(--lp-accent)]">
                    {i + 1}
                  </div>
                  <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--lp-fg)]">
                    {s.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">
                    {s.b}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* under the hood strip */}
          <Reveal delay={120}>
            <div className="lp-card mt-12 rounded-2xl p-7 sm:p-9">
              <div className="lp-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--lp-accent)]">
                {c.hoodKicker}
              </div>
              <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="max-w-xl">
                  <h3 className="lp-display text-2xl font-normal tracking-tight text-[var(--lp-fg)]">
                    {c.hoodTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">
                    {c.hoodBody}
                  </p>
                  <a
                    href="https://github.com/Lantr-Consulting/postpilot"
                    className="mt-3 inline-block text-sm font-medium text-[var(--lp-accent)] hover:text-[var(--lp-accent-ink)]"
                  >
                    {c.hoodLink} →
                  </a>
                </div>
                <div className="flex max-w-sm flex-wrap gap-1.5">
                  {[
                    "Next.js",
                    "Tailwind",
                    "FastAPI",
                    "LangChain",
                    "DeepSeek",
                    "Bluesky API",
                    "Google News RSS",
                    "Supabase",
                    "Railway",
                    "Vercel",
                  ].map((t) => (
                    <span
                      key={t}
                      className="lp-mono rounded-full border border-[var(--lp-line-strong)] px-3 py-1 text-[11px] text-[var(--lp-muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── who it's for ─────────────────────────────────── */}
      <section id="who" className="border-t border-[var(--lp-line)] bg-[var(--lp-bg2)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <Reveal>
            <div className="lp-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--lp-accent)]">
              {c.whoKicker}
            </div>
            <h2 className="lp-display mt-3 text-3xl font-normal tracking-tight text-[var(--lp-fg)] sm:text-4xl">
              {c.whoTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--lp-muted)]">
              {c.whoBody}
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {c.who.map((w, i) => (
              <Reveal key={w.t} delay={i * 90}>
                <div className="lp-card lp-lift h-full rounded-2xl border-t-2 border-t-[var(--lp-accent)] p-6">
                  <h3 className="text-[15px] font-semibold tracking-tight text-[var(--lp-fg)]">
                    {w.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">
                    {w.b}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── final CTA + footer (the single dark band) ────── */}
      <section className="lp-scene">
        <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-20 sm:px-8">
          <div className="text-center">
            <Reveal>
              <h2 className="lp-display mx-auto max-w-2xl text-balance text-3xl font-normal tracking-tight text-[var(--lp-fg)] sm:text-4xl">
                {c.ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--lp-muted)]">
                {c.ctaBody}
              </p>
            </Reveal>
            <Reveal delay={140}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/today" className="lp-btn h-12 px-6 text-[15px]">
                  {c.ctaPrimary} →
                </Link>
                <Link
                  href="/signin"
                  className="lp-btn-ghost h-12 border-[var(--lp-line-strong)] bg-transparent px-6 text-[15px] text-[var(--lp-fg)]"
                >
                  {c.ctaSecondary}
                </Link>
              </div>
            </Reveal>
          </div>
          <footer className="mt-16 border-t border-[var(--lp-line)] pt-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row">
              <div className="max-w-md">
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon.svg" alt="PostPilot" className="size-7 rounded-lg" />
                  <span className="text-sm font-semibold text-[var(--lp-fg)]">
                    PostPilot
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-[var(--lp-faint)]">
                  {c.footerDisclaimer}
                </p>
              </div>
              <div>
                <div className="lp-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--lp-faint)]">
                  {c.footerLinks}
                </div>
                <ul className="mt-3 space-y-1.5 text-[13px] text-[var(--lp-muted)]">
                  <li>
                    <a href="https://lantr.site" className="hover:text-[var(--lp-fg)]">
                      lantr.site — demo hub
                    </a>
                  </li>
                  <li>
                    <a href="https://analyst.lantr.site" className="hover:text-[var(--lp-fg)]">
                      AI Stock Analyst
                    </a>
                  </li>
                  <li>
                    <a href="https://airaware.lantr.site" className="hover:text-[var(--lp-fg)]">
                      AirAware
                    </a>
                  </li>
                  <li>
                    <a href="https://lantr.ai" className="hover:text-[var(--lp-fg)]">
                      lantr.ai
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/Lantr-Consulting/postpilot"
                      className="hover:text-[var(--lp-fg)]"
                    >
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
