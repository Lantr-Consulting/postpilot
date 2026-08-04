"use client";

/* Marketing landing at "/" — FORGE design language (matching lantr.site).
   The product lives behind it under /today etc. */

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
    hub: "Student showcase",
    signIn: "Sign in",
    openApp: "Open the demo",
    openDash: "Open your studio",
    badge: "Past Lantr student project · Hosted demo · Export-only",
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
    hoodKicker: "How the student built it",
    hoodTitle: "From a class idea to a live product.",
    hoodBody:
      "This project was completed by a past Lantr student. The student shipped a small first version, then added source-grounded drafting, editorial checks, accounts, memory, research workflows, and scheduled campaigns one working milestone at a time. Lantr now hosts the finished work for visitors to explore.",
    hoodLink: "Read the source on GitHub",
    whoKicker: "The student's direction",
    whoTitle: "A creator-and-AI question, taken all the way to launch.",
    whoBody:
      "The student chose a question at the intersection of storytelling, marketing, and software—and built a product that keeps the creator’s source material and final say at the center.",
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
      "A past Lantr student project, hosted by Lantr for demonstration. Drafts are suggestions—you review and publish them yourself.",
    footerLinks: "More from Lantr",
  },
  zh: {
    nav: { features: "主要功能", how: "使用流程", who: "作品方向" },
    hub: "往届作品",
    signIn: "登录",
    openApp: "体验作品",
    openDash: "打开内容工作台",
    badge: "Lantr 往届学生作品 · 草稿由用户审核 · 不会自动发布",
    h1: "让 AI 帮你写内容，但每个故事都来自你自己。",
    subLead: "把访谈、笔记和旧内容交给它，",
    subEm: "它只从你的真实材料里找选题、写初稿",
    subRest:
      "。每篇内容都会注明用了哪些材料，最后仍由你修改、审核和发布。",
    ctaPrimary: "开始体验",
    ctaSecondary: "注册体验账户",
    trust: [
      "只使用你提供的真实材料",
      "发布前逐条检查内容规则",
      "只生成和导出，不会自动发布",
    ],
    frameCaption: "学生完成的产品界面：整理材料、准备初稿和审核内容都在同一个工作台里。",
    featuresKicker: "学生做了什么",
    featuresTitle: "从整理材料到准备发布，把繁琐的工作串起来。",
    features: [
      {
        t: "整理一份长期使用的品牌资料",
        b: "把表达方式、个人经历和内容方向整理成一份资料。每次修改都有记录，需要时可以恢复旧版本。",
      },
      {
        t: "只从材料里找内容，不凭空编造",
        b: "上传访谈、笔记和旧帖子后，产品会整理出可以引用的事实和故事。每篇初稿都会注明用了哪些材料。",
      },
      {
        t: "发布前自动检查",
        b: "广告内容是否需要说明、字数是否超限、有没有不该出现的表达、内容是否重复，都会在交给你之前先检查一遍。",
      },
      {
        t: "跟进你所在领域的动态",
        b: "产品会参考 Bluesky、Reddit、Google News 和 Google Trends 的公开信息，帮助你找到值得讨论的新话题。",
      },
      {
        t: "定期回顾哪些内容有效",
        b: "根据你记录的发布结果，产品会提出调整建议。你确认采用后，这些经验会写回品牌资料。",
      },
      {
        t: "按计划提前准备内容",
        b: "可以设置定时研究和写作任务。等你回来时，初稿已经准备好，只等你检查。",
      },
    ],
    howKicker: "实际怎么用",
    howTitle: "先让它了解你，再一起把内容做出来。",
    how: [
      {
        t: "注册账户",
        b: "通过简单的引导填写基本信息，完成后再开始使用内容助手。",
      },
      {
        t: "告诉它你想做怎样的内容",
        b: "介绍自己的经历、表达方式和内容方向，再上传可以使用的材料。整理好的品牌资料由你确认。",
      },
      {
        t: "找选题、写初稿",
        b: "产品会从真实材料和近期动态中找选题，写好初稿后再逐条检查。",
      },
      {
        t: "你审核，再发布",
        b: "修改满意后再导出和发布。之后可以记录效果，供下一轮内容参考。",
      },
    ],
    hoodKicker: "作品是怎么完成的",
    hoodTitle: "从第一版网页，一步步做到可以使用。",
    hoodBody:
      "这是一位 Lantr 往届学生完成的项目。学生先做出可以操作的第一版，再逐步加入材料整理、内容写作、发布前检查、用户账户和定时任务。课程结束后，Lantr 继续托管这件作品，供访客体验。",
    hoodLink: "在 GitHub 阅读源码",
    whoKicker: "学生为什么选择这个题目",
    whoTitle: "既想让 AI 提高效率，也不想让它替创作者编故事。",
    whoBody:
      "学生关注的是：怎样让 AI 分担整理和写作工作，同时保留内容的真实性。因此，这件作品不只是生成文案，还把材料、选题、初稿、审核和发布前检查连成了一套产品。",
    who: [
      {
        t: "市场营销与传播",
        b: "把品牌定位、选题和编辑流程做成可以操作的软件，而不只是一份策划案。",
      },
      {
        t: "商业与创业",
        b: "把内容策略、执行记录和效果回顾放进同一套工作流程。",
      },
      {
        t: "计算机与人工智能",
        b: "处理大量文字材料，让 AI 能找到相关内容，并在生成结果之外加入明确的检查规则。",
      },
    ],
    ctaTitle: "让 AI 帮忙，但故事和发布权仍然属于你。",
    ctaBody: "使用同一个体验账户，也可以继续查看另外两件往届学生作品。",
    footerDisclaimer:
      "Lantr 往届学生作品，由 Lantr 继续托管。所有初稿都由用户审核并自行发布，产品不会自动发布。",
    footerLinks: "更多学生作品",
  },
} as const;

/* A stylized still of the product — the ink-and-paper desk, kept light. */
function ProductFrame({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
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
            {zh ? "材料库 · 条目 #14" : "Library · atom #14"}
          </div>
          <div
            className="mt-3 rounded-xl border border-[#211f1a1f] bg-white p-4"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 27px, #3a55d91a 27px, #3a55d91a 28px)",
            }}
          >
            <p className="lp-display text-[15px] italic leading-[28px] text-[#2c2a24]">
              {zh
                ? "“背伤以后第一次推起 315 磅的那天，我坐在车里哭了。不是因为这个数字，而是因为我整整 14 个月都没有放弃对自己的承诺。”"
                : "“The day I benched 315 after my back injury, I cried in my car. Not because of the number — because I’d kept a promise to myself for 14 months straight.”"}
            </p>
            <div className="lp-mono mt-3 text-[10px] text-[#8d887b]">
              {zh ? "摘自“3 月播客访谈.txt”" : "from “podcast-transcript-march.txt”"}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(zh ? ["亲身经历", "伤后恢复", "真实感受"] : ["story", "injury-comeback", "vulnerability"]).map((t) => (
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
            {zh ? "初稿 · LinkedIn · 使用材料 #14" : "Draft · LinkedIn · cites atom #14"}
          </div>
          <div className="mt-3 rounded-xl border border-[#211f1a1f] bg-white p-4">
            <p className="text-[13px] leading-relaxed text-[#2c2a24]">
              {zh
                ? "14 个月前，我弯腰系鞋带都会疼。昨天，我推起了 315 磅。重要的不是这个数字，而是我没有放弃当初的承诺。下面是我一直坚持的恢复计划……"
                : "Fourteen months ago I couldn’t tie my shoes without wincing. Yesterday I benched 315. The number isn’t the point — the promise is. Here’s the exact rehab protocol I followed…"}
            </p>
            <ul className="mt-3 space-y-1.5">
              {[
                [zh ? "符合平台 3,000 字符限制" : "Platform limit — 3,000 chars", true],
                [zh ? "没有使用禁用表达" : "No banned phrases", true],
                [zh ? "引用的材料可以找到" : "Atom citation resolves", true],
                [zh ? "含推广内容，需要补充说明" : "Sponsored — FTC disclosure added", false],
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
                {zh ? "通过" : "Approve"}
              </span>
              <span className="inline-flex flex-1 items-center justify-center rounded-full border border-[#211f1a2b] px-3 py-1.5 text-[12px] font-medium text-[#54514a]">
                {zh ? "导出" : "Export"}
              </span>
            </div>
          </div>
          <p className="lp-mono mt-3 text-[10px] leading-relaxed text-[#a09b8d]">
            {zh ? "由你审核，也由你亲自发布。" : "You post it. You own it."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [lang, setLang] = useState<Lang>("zh");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const languageTimer = window.setTimeout(() => {
      const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
      const savedLanguage = requestedLanguage === "en" || requestedLanguage === "zh"
        ? requestedLanguage
        : readLang();
      if (requestedLanguage === "en" || requestedLanguage === "zh") persistLang(savedLanguage);
      setLang(savedLanguage);
      document.documentElement.lang = savedLanguage === "zh" ? "zh-CN" : "en";
    }, 0);
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
    });
    return () => window.clearTimeout(languageTimer);
  }, []);

  function switchLang(next: Lang) {
    setLang(next);
    persistLang(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
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
              href={lang === "en" ? "https://lantr.site/en" : "https://lantr.site"}
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
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:pb-20">
          <div>
            <Reveal>
              <span className="lp-mono inline-flex items-center gap-2 rounded-full border border-[var(--lp-line-strong)] bg-[var(--lp-surface)] px-4 py-2 text-[11px] font-medium text-[var(--lp-muted)]">
                <span aria-hidden className="size-1.5 rounded-full bg-[var(--lp-accent)]" />
                {c.badge}
              </span>
            </Reveal>
            <h1 className="lp-display mt-7 max-w-3xl text-balance text-[2.6rem] font-normal leading-[1.04] tracking-[-0.02em] text-[var(--lp-fg)] sm:text-[4rem] lg:text-[3.8rem]">
              <Words text={c.h1} delay={120} />
            </h1>
            <Reveal delay={200}>
              <p className="mt-7 max-w-xl text-pretty text-base leading-relaxed text-[var(--lp-muted)] sm:text-lg">
                {c.subLead}
                <em className="lp-display italic text-[var(--lp-ink)]">{c.subEm}</em>
                {c.subRest}
              </p>
            </Reveal>
            <Reveal delay={280}>
              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row">
                <Link href="/today" className="lp-btn h-12 px-6 text-[15px]">
                  {c.ctaPrimary} →
                </Link>
                <Link href="/signin" className="lp-btn-ghost h-12 px-6 text-[15px]">
                  {c.ctaSecondary}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={360}>
              <div className="mt-8 grid gap-2 text-[13px] text-[var(--lp-muted)]">
                {c.trust.map((t) => (
                  <span key={t} className="flex items-center gap-2">
                    <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--lp-accent)]" />
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={360} className="min-w-0 lg:-mr-14">
            <ProductFrame lang={lang} />
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
                    <a
                      href={lang === "en" ? "https://lantr.site/en" : "https://lantr.site"}
                      className="hover:text-[var(--lp-fg)]"
                    >
                      lantr.site — {lang === "en" ? "student showcase" : "学生作品展"}
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
