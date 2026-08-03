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

## Status: Milestone 7 — Workspace

The agent's work went async. Research, mining, repurposing, and reviews now
run in background threads: the client gets a run id back immediately and
polls `pp_runs` for live progress ("Scanning your niche…", "Shaping
ideas…"). You can **steer a run mid-flight** — notes sent while the tools
are scanning are read before the ideas get shaped. A fresh research run
**supersedes** still-pending ideas from older runs, so last week's trends
don't sit in the Studio looking current. And the per-user run lock lives in
the database — a partial unique index makes the INSERT the claim, arbitrated
by Postgres across both uvicorn workers (an in-memory lock dies with 2
workers; runs orphaned by a restart are failed and reclaimed after 10
minutes). Verified live: a second run while one is running gets a 409.

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
| 8. Campaigns | Scheduler with cross-worker claim, scheduled weekly reviews *(next)* |
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

Then open http://localhost:3000. The frontend falls back to sample data
without the backend. To run the brain locally:

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
echo "DEEPSEEK_API_KEY=sk-..." > .env   # any OpenAI-compatible key works
.venv/bin/uvicorn main:app --port 8020
```

Backend in production: https://postpilot-backend-production-c081.up.railway.app
