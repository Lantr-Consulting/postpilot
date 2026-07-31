# PostPilot

Your AI Growth Lead for your personal IP: it learns your story, intended IP,
and voice in plain English, mines the raw materials you upload — transcripts,
notes, old posts — for the stories only you can tell, studies what's working
in your niche right now, plans your calendar, drafts platform-tailored posts
you approve, edit, and export — then reviews the results you log and adjusts
the strategy.

> **AI-generated drafts — you review everything before it's posted.
> Performance data is self-reported.** PostPilot never publishes on your
> behalf; you are the actuator.

A Lantr sample project, built in the same order a student builds theirs.

**Live:** https://postpilot-drab-seven.vercel.app

## Status: Milestone 1 — First Ship

All nine screens are live on typed mock data shaped like the real records
(`lib/types.ts`, `lib/mock.ts` — a full fixture creator: profile, materials
and mined atoms, a week of pipeline, logged results), so later milestones
swap mocks for APIs without reshaping the UI. The fixture demonstrates the
control model already: one sponsored draft is missing its "#ad" disclosure
and the editorial engine's check rows are blocking it. Full design in
[DESIGN.md](DESIGN.md).

- **Today** — calendar strip, pipeline counts, streak, latest Growth Lead insight
- **Studio** — niche radar → idea cards evidenced by trend + your own material → platform-tailored drafts → edit, approve, export
- **Library** — upload transcripts/notes/old posts; the agent mines them into tagged, searchable content atoms; repurpose one material into a week
- **Growth Lead** — chat + goals + on-demand growth reviews, grounded in your IP, your corpus, and your logged results
- **Calendar** — approved drafts slotted per day, one-click export pack
- **Creator IP** — plain English → interpreted, versioned brand book → explicit Activate
- **Campaigns** — standing missions on a schedule, including the built-in weekly growth review
- **Performance** — self-reported results, trends, what the Growth Lead learned
- **Settings** — editorial rules you own, platforms, keys, kill switch

## Roadmap

| Milestone | What ships |
|---|---|
| 0. Design | This document set: scope, control model, data sources, plan ✅ |
| 1. First Ship | Frontend on Vercel, all nine screens on typed mock data ✅ |
| 2. Design pass | Writer's-desk personality, platform accent chips, atom badges, visual polish *(next)* |
| 3. The Brain | Python backend on Railway; IP interpreter + grounded chat; niche radar goes live on real data |
| 4. Hands | Editorial engine (pure code, cited rules) + LangChain agent; material ingestion and idea → draft → export both live |
| 5. Memory & accounts | Supabase database, sign-in, one creator per user |
| 6. Growth Lead upgrade | Onboarding/Activate, versioned brand book, goals, repurposing, growth reviews, decline-reason lessons |
| 7. Workspace | Async runs (research/ingestion/review), threads, staleness supersession |
| 8. Campaigns | Scheduler with cross-worker claim, scheduled weekly reviews |
| 9. Evals | Deterministic checks (incl. atom citations resolve) + calibrated LLM judge for voice fidelity; measured improvement |
| 10. Polish + Blueprint | Product polish, BLUEPRINT.md demo package, BUILD_GUIDE.md |

## Stack

Next.js + Tailwind on Vercel (this repo) · Python + LangChain + DeepSeek on
Railway · YouTube Data API, Reddit, Bluesky, Google News RSS (free, at most
one key) · Supabase (Postgres + auth). All free tier, no credit card.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Everything runs on sample data — the
backend arrives at Milestone 3.
