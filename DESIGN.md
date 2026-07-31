# PostPilot — Design, Scope & Build Plan

> The third flagship sample for Lantr's AI Agent Builder track, sibling of
> the AI Stock Analyst and AirAware. A student with zero experience, following
> the course, ends with this: a live, multi-user **AI Growth Lead for a
> creator's personal IP**. This document is the approved design — written
> *before* the build, like the second sample. A `BUILD_GUIDE.md` (what
> actually happened, phase by phase) gets written after, as reconstruction
> notes.
>
> **AI-generated drafts — you review everything before it's posted.
> Performance data is self-reported.** Every screen carries this label.

---

## 1. What it is

**One-liner:** *PostPilot is for creators who know what they want to be known
for but burn out producing content — streamers, coaches, founders, artists.
You tell it your story, your intended IP, and your voice in plain English,
and you feed it your raw materials — podcast transcripts, talk notes, old
posts, brain dumps. It becomes your AI Growth Lead: mines your materials for
the stories and takes only you can tell, studies what's working in your niche
right now, plans your calendar, drafts platform-tailored posts you approve,
edit, and export — and reviews the results you log to adjust the strategy.*

**Minimum complete product:** a signed-in creator can describe their intended
IP, background, narratives, and voice in plain English, review and activate
the interpreted Creator IP profile, upload raw materials that the agent mines
into a searchable library of content atoms (stories, takes, lessons, quotes),
run research over live niche signals to get content ideas evidenced by *both*
the outside trend and their own material, approve ideas into
platform-tailored draft variants that a deterministic editorial engine has
checked, edit and export approved drafts to post by hand, log how each post
performed, and get a growth review that reads their goals, their pipeline,
and their logged results — with every screen labeled "AI-generated drafts —
you review everything before it's posted."

**Control model:** the LLM drafts; **`editorial.py` decides what ships.**
All hard rules live in pure code, never in the prompt: per-platform character
limits (from the platforms' own documentation), FTC endorsement-disclosure
checks on anything marked sponsored (16 CFR Part 255 — "code disposes" still
means "code cites"), hashtag and emoji caps, a banned-phrase list the user
owns, link allowlisting, and duplicate detection against everything the
creator has already shipped. The engine can veto — a sponsored draft with no
disclosure never reaches the export queue — and re-checks at approve time,
after edits. The user owns every rule.

And one grounding rule with teeth: **the agent never invents the creator's
life.** Personal stories, credentials, and anecdotes in a draft must trace to
the IP profile or a Library atom, cited on the draft; if the material isn't
there, the agent asks for it instead of fabricating it. This is the third
sample's version of "never assert market facts from memory" — the facts the
model is most tempted to hallucinate here are *yours*.

On top of the shared spine, this sample stakes two new lessons:

1. **Quality is context engineering.** The versioned Creator IP profile plus
   the mined Library corpus are injected into every generation. The demo
   thesis: output quality tracks the depth of that context, not the
   cleverness of the prompt. An agent holding your forty stories writes
   better than a clever prompt holding none — feed it more, watch the same
   pipeline write better.
2. **The human is the actuator.** No platform grants a free write API worth
   teaching (see §4), so PostPilot closes its loop without one: the agent
   proposes, the creator approves and exports, posts by hand, and logs the
   results — and the growth review adapts the strategy. A feedback loop
   needs a measurement path, not write access. Being agentic here means
   *mining, planning, and reviewing* — not pressing the post button.

## 2. Capability map

| Surface | Capabilities |
|---|---|
| **Today** | This week's calendar strip; pipeline counts (materials to mine / ideas awaiting review / drafts to approve / ready to export); posting streak; the Growth Lead's latest insight card; permanent disclaimer |
| **Studio** | The pipeline: **Niche radar** rail (live trending signals, works before sign-in on default niches) → idea cards with dual evidence (outside trend + your own atom) and pillar tags → accept/decline-with-reason → platform-tailored draft variants with per-check annotation rows → edit in place → approve → export queue |
| **Library** | Upload or paste raw materials (transcripts, talk notes, old posts, newsletters, brain dumps — text in v1); async **ingestion runs** mine each material into tagged content atoms (story / take / lesson / quote / stat) mapped to pillars and narratives; search the corpus; per-atom usage counts; "repurpose this" turns one long material into a week of drafts |
| **Growth Lead** | Threaded persistent chat (markdown) with research + library tools in hand, grounded in the IP profile, the corpus, and logged results; **goals** the creator sets in plain English; on-demand **growth reviews** — a run that reads goals, pillar coverage, calendar, and performance, and reports strategy moves with rationale; "plan my week" launches a run into the conversation with progress |
| **Calendar** | Week/month grid; approved drafts slotted per day and platform; drag to reslot; per-day **export pack** (copy-ready text per platform) |
| **Creator IP** | Plain-English interview ("tell me your story, what you want to be known for") → interpreted, **versioned** brand book: positioning, pillars, background, narrative arcs, voice do/don'ts, audience — review-and-**Activate** onboarding; nothing generates until the creator blesses it |
| **Campaigns** | User-authored standing missions (custom prompt + cadence: manual / daily / weekly), e.g. "every Monday, plan my week around the launch" or the built-in weekly growth review; latest report + past runs per campaign; scheduler with cross-worker claim |
| **Performance** | Log results per posted draft (views, likes, comments, saves, follows — self-reported); simple trend charts; "what's working" insights the Growth Lead turns into standing lessons |
| **Settings** | Editorial rules the user owns (banned phrases, hashtag caps, sponsored-disclosure text); enabled platforms and formats; per-user LLM key with shared-demo fallback; pause/kill switch |

**The approval loop:** ideas arrive as cards — angle, rationale, pillar,
evidence rows citing both the research that motivated them and the Library
atom they draw on. Accept an idea → drafts are generated as
**platform-tailored variants** (X-length, LinkedIn tone, Instagram caption +
hashtags, Bluesky, YouTube title/description), each carrying its editorial
check rows and its atom citations. The draft text itself is editable (the
analog of the first sample's editable share count and the second's editable
time window); approve re-runs `editorial.py` on the *edited* text before the
draft joins the calendar and export queue. Decline requires a reason; the
last N decline reasons are injected into the generation prompt as standing
lessons ("declined 'hot take' angles three times: too spicy — stay in
teacher mode"). Export marks the draft posted-pending; logging a result
closes it. Growth-review strategy moves ("retire pillar X, it's not
landing") are proposals too — accepted ones become profile amendments, so
the strategy the agent runs is always one the creator blessed.

## 3. Architecture

```
Browser (Next.js on Vercel)
   │  supabase-js session token on every request
   ▼
FastAPI on Railway (2 uvicorn workers)
   ├─ auth.py       Bearer token → Supabase /auth/v1/user → user id
   ├─ main.py       endpoints + campaign scheduler thread + run threads
   │                (research, ingestion, growth review)
   ├─ agent.py      LangChain tool-calling growth lead (DeepSeek)
   ├─ research.py   niche-signal fetchers: YouTube Data API, Reddit JSON,
   │                Bluesky AppView, Google News RSS, Google Trends (unofficial)
   ├─ library.py    material ingestion → atom extraction + keyword search
   ├─ editorial.py  deterministic editorial engine (pure code, cited rules)
   └─ db.py         PostgREST client (service key) → Supabase Postgres
External: DeepSeek (LLM, OpenAI-compatible) · YouTube Data API (free key) ·
Reddit + Bluesky + Google News RSS (keyless) · Supabase (Postgres, Auth, RLS)
```

**Stack (all free tier, no credit card):** Next.js + Tailwind 4 on Vercel ·
Python FastAPI + LangChain on Railway · DeepSeek `deepseek-chat` (students
may use Claude via the Lantr gateway) · Supabase. Library search is plain
keyword/tag matching in Postgres — no vector database; the corpus is small
and the lesson ("retrieval is just: find the right context") survives without
embeddings infrastructure.

**Data model** (typed in `lib/types.ts` from Milestone 1, mirrored by
`backend/schema.sql` in Milestone 5):

- `creators` — one per user: ip_profile jsonb **with version history**
  (positioning, pillars[], background_md, narratives[] {title, arc, status},
  voice jsonb {tone, do[], dont[], catchphrases[]}, audience jsonb,
  goals[] {statement, horizon}), editorial_rules jsonb (the user-blessed
  rules the engine enforces), platforms[] enabled, niche jsonb {topics[],
  subreddits[], queries[]}, activated, paused.
- `materials` — title, kind (transcript/notes/post/newsletter/other),
  text_md, status (uploaded/ingesting/mined), run_id.
- `atoms` — material_id, kind (story/take/lesson/quote/stat), text,
  pillars[], narrative?, used_count.
- `ideas` — the decisions analog: title, angle, pillar, rationale,
  evidence[] (source, url?, atom_id?, datum), status
  (proposed/accepted/declined/superseded), feedback jsonb {reason}, run_id.
- `drafts` — idea_id, platform, text, hashtags[], sponsored bool,
  atom_ids[], checks jsonb[] (e.g. `{rule: "ftc_disclosure", required:
  true, pass: false, source: "16 CFR 255"}`), status (draft/approved/
  exported/posted/declined), slot_date, feedback jsonb {reason}.
- `results` — draft_id, posted_at, metrics jsonb {views, likes, comments,
  saves, follows} (self-reported), notes.
- `runs` — kind (research/ingestion/review), status, steer[], report,
  campaign_id?, thread_id?, material_id?.
- `threads` + `messages` — Growth Lead chat.
- `campaigns` — title, prompt, cadence (manual/daily/weekly), hour_local,
  enabled, last_run_at (CAS claim column); the weekly growth review ships as
  a built-in campaign.

RLS: users read only their own rows ("two people, two worlds"); writes go
through the backend service key. The Studio radar's default-niche trends use
public endpoints.

**Key API surface:** `/me`, `/me/settings`, `/me/activate`,
`/interpret-profile`, `/materials` CRUD (+ `/materials/{id}/ingest`,
`/materials/{id}/repurpose`), `/atoms?q=`, `/runs` (+ `/steer`),
`/ideas/{id}/accept` / `/decline` (with reason), `/drafts/{id}` (edit) /
`/approve` / `/decline` / `/export` / `/log-result`, `/calendar`,
`/reviews/run`, `/chat` (+ `/chat/history`), `/threads`, `/campaigns`
(+ `/run`), public `/trends?topics=`.

**Agent tools:** `youtube_trending(topic, region)`, `youtube_search(q)`,
`reddit_hot(subreddit)`, `bsky_search(q)`, `news_headlines(q)`,
`google_trends(topic)` (null-tolerant), `get_creator_profile()`,
`search_atoms(query, pillar?)`, `get_material(id)`, `get_past_content(n)`,
`get_performance_summary()`, and `check_draft(platform, text, sponsored)` —
the editorial engine itself exposed as a tool, so the agent writes *with the
ruler in hand*, and the server re-runs the same engine on whatever it
submits. Model drafts; code still measures the final cut.

## 4. Data sources

All free and card-free; one free API key total (YouTube). The richest data
source is one no competitor has: **the creator's own materials**, uploaded
and mined in-app.

| Signal | Source |
|---|---|
| The creator's IP | Uploaded materials (transcripts, notes, past posts — text), mined into atoms by `library.py` |
| Video trends + niche search | YouTube Data API v3 — `videos.list chart=mostPopular`, `search.list`, video/channel stats; free key, 10,000 units/day, no card |
| Community conversation | Reddit public JSON — `reddit.com/r/{sub}/hot.json` etc.; keyless, custom `User-Agent` required, modest rate limits |
| Short-form social pulse | Bluesky public AppView — `public.api.bsky.app` `app.bsky.feed.searchPosts`; fully keyless reads |
| Niche news | Google News RSS — `news.google.com/rss/search?q=`; keyless |
| Search interest | Google Trends via its **unofficial** JSON endpoint — no key; taught explicitly as *an unofficial API that will break someday* (this sample's Pollen.com), nullable end-to-end |
| LLM | DeepSeek `deepseek-chat`, OpenAI-compatible (students: Claude via the Lantr gateway) |
| Memory & auth | Supabase (Postgres, magic link, RLS) — Milestone 5 |

**The publishing decision (teachable):** there is no platform where the full
publish-and-measure loop is free. X's free tier allows ~500 writes/month but
locks reads — including your own post's metrics — behind a paid tier. Meta
(Instagram) requires a business account, app review, and a linked Facebook
Page. TikTok's Content Posting API requires an audit. LinkedIn allows
self-serve posting but gates engagement reads behind a partner program. So
PostPilot is **export-first by design**: drafts come in platform-tailored
variants with one-click copy, the creator posts by hand, and results are
logged by hand. This is taught as the API-economics lesson — real content
products face exactly this wall — and it forces the design toward where the
agent genuinely earns its keep: mining the creator's materials, planning,
and reviewing. Every research fetcher degrades gracefully (Trends is
nullable; the agent is prompted never to invent metrics, trend data, or the
creator's own stories), and the whole app falls back to Milestone-1 mock
data offline.

## 5. Build plan: milestone by milestone

Each milestone is one working session ending with a deploy and a git tag,
mapped onto the AI Agent Builder modules the same way the first two samples
were.

### Milestone 0 — Design (this commit) — `milestone-0-design`
This document, README, conventions files. No code: the project brief precedes
the dev environment in the course, and the sample stays honest to that order.

### Milestone 1 — First Ship: the face — `milestone-1-first-ship`
Scaffold Next.js + Tailwind. Build all nine screens against **typed mock
data shaped like the real records** (`lib/types.ts`, `lib/mock.ts` — a full
fixture creator: profile, materials and mined atoms, a week of pipeline,
logged results) so later milestones swap mocks for APIs without reshaping
UI. GitHub public repo, Vercel deploy. First-sample gotchas apply: lowercase
folder name, connect the repo and ship via push.

### Milestone 2 — Design pass — `milestone-2-design`
Design tokens in `globals.css`; a studio personality — the product should
feel like a writer's desk, not a dashboard. Wordmark, favicon, per-platform
accent chips on draft variants, atom-kind badges in the Library,
pipeline-stage color system, focus states. Verify in the browser, not just
the build.

### Milestone 3 — The Brain — `milestone-3-brain`
FastAPI on Railway (Procfile, 2 workers, `.railwayignore`).
`/interpret-profile` (plain English → Creator IP v1 JSON via JSON-mode
prompt) and `/chat` grounded in the profile. **First real data ships here:**
`research.py` + the public `/trends` endpoint power the Studio niche radar
live — the keyless sources let real data land a full phase earlier than the
stock analyst could.

### Milestone 4 — Hands — `milestone-4-hands`
`editorial.py`: platform limits, FTC disclosure check, hashtag/emoji caps,
banned phrases, duplicate distance — unit-tested, every rule carrying its
citation. LangChain agent + research and library tools + `check_draft`. Both
agentic pipelines go live: **ingestion** (upload a material → async run →
tagged atoms in the Library) and **generation** (research run → idea cards
evidenced by trend + atom → accept → draft variants → edit/approve → export
pack). The set-piece demo: the first sponsored draft omits the disclosure
and the engine blocks it — model drafts, code disposes.

### Milestone 5 — Memory & accounts — `milestone-5-memory`
Supabase: schema above, magic-link sign-in, RLS read-own policies, backend
auth dependency; profiles, materials, atoms, pipeline, threads, and results
move to Postgres. First-sample gotchas carry over: ~2 magic links/hour on
free email, set Site URL + redirect allowlist early, admin `generate_link`
is the test harness.

### Milestone 6 — The Growth Lead upgrade — `milestone-6-growth-lead`
The user-feedback lab, and this sample's thesis milestone. Onboarding:
creators start empty + inactive → interview → review the interpreted brand
book → explicit Activate. Profile becomes properly **versioned** (edit →
new version, diffable). Narrative arcs and goals become first-class (ideas
carry arc position; reviews read goals). **Repurposing** ships ("turn this
transcript into next week"), and the on-demand **growth review** run: goals
+ pillar coverage + calendar + logged results → strategy moves proposed as
cards, accepted moves amending the profile. Decline-reasons → standing
lessons. Demonstrate the thesis on stage: same pipeline, empty Library vs.
mined Library, visibly better drafts. Patch prompts with asserts.

### Milestone 7 — Workspace — `milestone-7-workspace`
Async runs of all three kinds (background thread + DB-status polling +
progress UI + mid-run steering), threaded chat history, **staleness
supersession** (a new research run supersedes still-pending idea cards built
on last week's trends), per-user run lock in the database (CAS — an
in-memory lock dies with 2 workers).

### Milestone 8 — Campaigns — `milestone-8-campaigns`
`campaigns` CRUD + Run now; 60-second scheduler claiming due campaigns via
compare-and-swap so exactly one worker fires. The built-in weekly growth
review becomes scheduled; Monday-morning plans land as a report + a batch of
idea cards. Campaign reports live on their own cards; chat-initiated runs
report into their thread — keep the surfaces separate.

### Milestone 9 — Evals — `milestone-9-evals`
Where this sample extends the second one pedagogically: AirAware taught
evals where ground truth is computable; PostPilot teaches the honest split
**when it isn't**. An 8–10 case eval set (fixture briefs × fixture creator
profiles × a fixture Library). Deterministic checks score what code can
check: sponsored ⇒ disclosure present, per-platform length, banned phrases
absent, duplicate distance, variant coverage, hashtag caps, **atom citations
resolve** (no invented stories). An LLM judge scores what it can't: voice
fidelity against the IP profile (uses the do's, avoids the don'ts), hook
strength, grounding (does the draft actually use the cited atom?) — with the
judge calibrated against a small human-labeled anchor set before its scores
are trusted. Commit the baseline, then land **one measured improvement**
(candidate: inject top-performing logged posts as few-shot examples; watch
voice fidelity move).

### Milestone 10 — Polish + BLUEPRINT — `milestone-10-blueprint`
Theme finalization (light/dark token sets), markdown chat bubbles,
optimistic actions + toasts, notification bell, status filters, sticky
rails, export-pack polish (per-platform copy buttons, "copied" states).
Write `BLUEPRINT.md` as the Demo Day package and `BUILD_GUIDE.md` as the
reconstruction record.

## 6. Deliberately out of scope

No live publishing to any platform — export only, v1 through v-last; the
human is the actuator by design, not by cut. No engagement scraping or
unofficial write automation against platform ToS. No audio/video
transcription — materials arrive as text (paste the transcript; Whisper-tier
APIs break the no-card rule), and no image or video generation — PostPilot
writes; the creator shoots. No vector database — keyword/tag retrieval is
the v1 lesson. No follower-count or income promises — the permanent label
stays. No multi-creator agencies, teams, or client seats. No paid data
sources, ever — the no-credit-card rule is a design constraint, not a budget
preference.
