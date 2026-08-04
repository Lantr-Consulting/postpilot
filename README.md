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

A past Lantr student project, kept online by Lantr as a hosted demonstration.

**Live:** https://postpilot.lantr.site

## Status: Milestone 8 — Campaigns

The Growth Lead works while you don't. Campaigns are standing missions in
plain English ("every Monday, plan my week…") with a cadence; a 60-second
scheduler loop runs in every backend worker, and a **compare-and-swap
claim** — a PATCH whose WHERE re-checks `last_run_at` — guarantees exactly
one worker fires each due campaign (each PostgREST PATCH is its own
transaction; the race's loser matches zero rows). Every new account ships
with the built-in **weekly growth review** as a campaign; custom missions
run through the researcher, and their idea batches land in the Studio while
reports stay on the campaign card — separate surfaces, by design. Verified
live: the scheduler claimed and fired a due campaign autonomously within
one tick, and its review cited the account's real pipeline numbers. Paused
or not-yet-activated creators are skipped — always-on never overrides the
Activate gate or the kill switch.

Full design in [DESIGN.md](DESIGN.md).

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
| 2. Design pass | Writer's-desk personality, platform accent chips, atom badges, visual polish ✅ |
| 3. The Brain | Python backend on Railway; IP interpreter + grounded chat; niche radar goes live on real data ✅ |
| 4. Hands | Editorial engine (pure code, cited rules) + LangChain agent; material ingestion and idea → draft → export both live ✅ |
| 5. Memory & accounts | Supabase database, sign-in, one creator per user ✅ |
| 6. Growth Lead upgrade | Onboarding/Activate, versioned brand book, goals, repurposing, growth reviews, decline-reason lessons ✅ |
| 7. Workspace | Async runs (research/ingestion/review), threads, staleness supersession ✅ |
| 8. Campaigns | Scheduler with cross-worker claim, scheduled weekly reviews ✅ |
| 9. Evals | Deterministic checks (incl. atom citations resolve) + calibrated LLM judge for voice fidelity; measured improvement *(next)* |
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

Then open http://localhost:3000. The frontend falls back to sample data
without the backend. To run the brain locally:

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
echo "DEEPSEEK_API_KEY=sk-..." > .env   # any OpenAI-compatible key works
.venv/bin/uvicorn main:app --port 8020
```

Backend in production: https://postpilot-backend-production-c081.up.railway.app
