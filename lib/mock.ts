// Milestone 1 fixture: one full creator — profile, materials and mined atoms,
// a week of pipeline, logged results. Shaped exactly like the real records so
// later milestones swap in APIs without reshaping the UI.

import type {
  Atom,
  Campaign,
  Creator,
  Draft,
  GrowthReview,
  Idea,
  Material,
  ResultLog,
  Thread,
  TrendItem,
} from "./types";

// The fixture week. Monday of the current mock week:
export const TODAY = "2026-07-31";
export const WEEK_DATES = [
  "2026-07-27",
  "2026-07-28",
  "2026-07-29",
  "2026-07-30",
  "2026-07-31",
  "2026-08-01",
  "2026-08-02",
];

export const STREAK_DAYS = 12;

export const CREATOR: Creator = {
  name: "Jordan Avila",
  handle: "@coachjavila",
  niche: {
    topics: ["strength training", "fitness over 30", "habit building"],
    subreddits: ["fitness", "weightroom", "xxfitness"],
    queries: ["minimalist training", "busy professional workout"],
  },
  platforms: ["x", "linkedin", "instagram", "bluesky"],
  activated: true,
  paused: false,
  ipProfile: {
    version: 3,
    updatedAt: "2026-07-26",
    positioning:
      "The coach who proves busy professionals can get strong on three hours a week — evidence over hype.",
    pillars: [
      "Myth-busting",
      "Client stories",
      "Minimalist protocols",
      "Coach's notebook",
    ],
    backgroundMd:
      "Physical therapist for eight years, burned out on 6-am-to-9-pm clinic days, rebuilt my own training around three focused hours a week while raising two kids. Went online in 2023; now coach 40 desk-bound professionals. I've lived both sides: the injury table and the barbell.",
    narratives: [
      {
        title: "From burnout PT to online coach",
        arc: "Origin story — why I left the clinic and what it taught me about sustainable training.",
        status: "running",
      },
      {
        title: "The 3-hour week experiment",
        arc: "Documenting a full year of my own minimalist programming, numbers public.",
        status: "running",
      },
      {
        title: "Client 100",
        arc: "The road to my hundredth client — what changes at scale.",
        status: "seed",
      },
    ],
    voice: {
      tone: "Warm, direct, zero hype. A coach talking to one person, not a stage.",
      do: [
        "Use specific numbers and time-frames",
        "Write in second person",
        "Short sentences. One idea each.",
        "Admit what I don't know",
      ],
      dont: [
        "Bro-science slang",
        "Guilt or shame framing",
        "Emoji walls",
        "Promising outcomes I can't back",
      ],
      catchphrases: ["Strong enough for your life", "Three good hours"],
    },
    audience:
      "Desk-bound professionals, 30–45, who used to train, fell off, and don't believe they have time to get back.",
    goals: [
      { statement: "Grow the newsletter to 5,000 subscribers", horizon: "by December" },
      { statement: "Land 10 new coaching clients from content", horizon: "this quarter" },
      { statement: "Be the name people cite for minimalist strength", horizon: "12 months" },
    ],
  },
  editorialRules: {
    bannedPhrases: ["game-changer", "crushing it", "no excuses", "beast mode"],
    sponsoredDisclosure: "#ad",
    maxHashtags: 4,
    maxEmoji: 3,
  },
};

// ---------- Library ----------

export const MATERIALS: Material[] = [
  {
    id: "mat-1",
    title: "Podcast: The Lifting Dad ep. 41 (my interview)",
    kind: "transcript",
    addedAt: "2026-07-21",
    words: 8420,
    status: "mined",
    atomCount: 6,
    excerpt:
      "…people think I quit the clinic because I hated PT. I quit because I was prescribing rest I never took myself. The wake-up call was falling asleep at a red light on route 9…",
  },
  {
    id: "mat-2",
    title: "Newsletter archive: 'Three good hours' #1–#8",
    kind: "newsletter",
    addedAt: "2026-07-23",
    words: 6150,
    status: "mined",
    atomCount: 5,
    excerpt:
      "…the protocol fits on an index card: squat pattern, hinge pattern, push, pull, carry. Two sets that matter beat five sets that don't…",
  },
  {
    id: "mat-3",
    title: "Voice-memo brain dump: client plateaus",
    kind: "notes",
    addedAt: "2026-07-29",
    words: 1240,
    status: "ingesting",
    atomCount: 0,
    excerpt:
      "…the plateau conversation always starts with sleep, never with sets. Note to self: Dana's bench story is the perfect example if she's okay with me sharing it…",
  },
];

export const ATOMS: Atom[] = [
  {
    id: "atom-1",
    materialId: "mat-1",
    materialTitle: "Podcast: The Lifting Dad ep. 41",
    kind: "story",
    text: "Fell asleep at a red light on route 9 after a 14-hour clinic day — the moment I knew the schedule was the injury.",
    pillars: ["Coach's notebook"],
    narrative: "From burnout PT to online coach",
    usedCount: 2,
  },
  {
    id: "atom-2",
    materialId: "mat-1",
    materialTitle: "Podcast: The Lifting Dad ep. 41",
    kind: "take",
    text: "Most 'no time to train' problems are actually 'no plan that fits the time' problems.",
    pillars: ["Myth-busting", "Minimalist protocols"],
    usedCount: 3,
  },
  {
    id: "atom-3",
    materialId: "mat-1",
    materialTitle: "Podcast: The Lifting Dad ep. 41",
    kind: "stat",
    text: "In 8 years of clinic work, roughly 7 in 10 of my overuse injuries were people training 5+ days a week on bad recovery.",
    pillars: ["Myth-busting"],
    usedCount: 1,
  },
  {
    id: "atom-4",
    materialId: "mat-1",
    materialTitle: "Podcast: The Lifting Dad ep. 41",
    kind: "quote",
    text: "\"I was prescribing rest I never took myself.\"",
    pillars: ["Coach's notebook"],
    narrative: "From burnout PT to online coach",
    usedCount: 0,
  },
  {
    id: "atom-5",
    materialId: "mat-2",
    materialTitle: "Newsletter 'Three good hours'",
    kind: "lesson",
    text: "The index-card protocol: squat, hinge, push, pull, carry. Two sets that matter beat five that don't.",
    pillars: ["Minimalist protocols"],
    narrative: "The 3-hour week experiment",
    usedCount: 4,
  },
  {
    id: "atom-6",
    materialId: "mat-2",
    materialTitle: "Newsletter 'Three good hours'",
    kind: "story",
    text: "Client Dana added 20 lb to her bench in 12 weeks training twice a week — after cutting a day, not adding one.",
    pillars: ["Client stories"],
    usedCount: 1,
  },
  {
    id: "atom-7",
    materialId: "mat-2",
    materialTitle: "Newsletter 'Three good hours'",
    kind: "take",
    text: "Progress photos lie week to week; training logs don't. Track the bar, not the mirror.",
    pillars: ["Myth-busting", "Coach's notebook"],
    usedCount: 0,
  },
  {
    id: "atom-8",
    materialId: "mat-2",
    materialTitle: "Newsletter 'Three good hours'",
    kind: "stat",
    text: "My own year of 3-hour weeks: squat up 35 lb, deadlift up 50 lb, bodyweight unchanged. Numbers public in the experiment log.",
    pillars: ["Minimalist protocols"],
    narrative: "The 3-hour week experiment",
    usedCount: 2,
  },
];

// ---------- Niche radar ----------

export const TRENDS: TrendItem[] = [
  {
    id: "tr-1",
    source: "youtube",
    title: "\"I trained 30 minutes a day for a year\" video crossing 2.1M views",
    datum: "2.1M views in 6 days · fitness trending",
  },
  {
    id: "tr-2",
    source: "reddit",
    title: "r/fitness thread: \"Over 35 lifters — what actually changed your consistency?\"",
    datum: "4.8k upvotes · top this week",
  },
  {
    id: "tr-3",
    source: "news",
    title: "New meta-analysis: two weekly sessions retain ~90% of strength gains vs four",
    datum: "Google News · 14 outlets in 48h",
  },
  {
    id: "tr-4",
    source: "bluesky",
    title: "\"Minimalist training\" mentions up sharply; skepticism about 6-day PPL splits",
    datum: "Bluesky search · 3x baseline mentions",
  },
  {
    id: "tr-5",
    source: "trends",
    title: "\"3 day workout split\" search interest at a 12-month high",
    datum: "Google Trends · breakout",
  },
];

// ---------- Ideas ----------

export const IDEAS: Idea[] = [
  {
    id: "idea-1",
    title: "The meta-analysis says two sessions keep 90% of your gains",
    angle:
      "News-jack the new study with my clinic-years take: frequency was never the problem, recovery was.",
    pillar: "Myth-busting",
    rationale:
      "The study is making rounds (14 outlets) and lands exactly on the positioning. Pair the external number with the 7-in-10 overuse stat from the podcast.",
    evidence: [
      {
        source: "Google News",
        datum: "Meta-analysis covered by 14 outlets in 48h",
      },
      {
        source: "Library",
        atomId: "atom-3",
        datum: "7 in 10 overuse injuries came from 5+ day/week training on bad recovery",
      },
    ],
    status: "proposed",
    runId: "run-1",
  },
  {
    id: "idea-2",
    title: "Dana's bench: the day we cut from her program",
    angle:
      "Client story against the 'add more days' instinct — 20 lb bench PR after removing a training day.",
    pillar: "Client stories",
    rationale:
      "r/fitness consistency thread shows the audience is asking exactly this. Dana's story is mined and cleared for use.",
    evidence: [
      {
        source: "Reddit r/fitness",
        datum: "\"What changed your consistency?\" — 4.8k upvotes",
      },
      {
        source: "Library",
        atomId: "atom-6",
        datum: "Dana: +20 lb bench in 12 weeks training twice a week",
      },
    ],
    status: "accepted",
    runId: "run-1",
  },
  {
    id: "idea-3",
    title: "The index card that replaced my programming app",
    angle:
      "Minimalist protocol as a visual: the five-pattern index card, with my own year of numbers.",
    pillar: "Minimalist protocols",
    rationale:
      "\"3 day workout split\" searches at a 12-month high; the card is the most-shared thing in the newsletter.",
    evidence: [
      {
        source: "Google Trends",
        datum: "\"3 day workout split\" at 12-month search high",
      },
      {
        source: "Library",
        atomId: "atom-5",
        datum: "The index-card protocol: squat, hinge, push, pull, carry",
      },
    ],
    status: "proposed",
    runId: "run-1",
  },
  {
    id: "idea-4",
    title: "React to the 30-minutes-a-day video",
    angle: "Ride the 2.1M-view video with a hot-take response thread.",
    pillar: "Myth-busting",
    rationale: "Large wave, adjacent audience.",
    evidence: [
      {
        source: "YouTube",
        datum: "\"30 minutes a day\" video at 2.1M views in 6 days",
      },
    ],
    status: "declined",
    declineReason:
      "Reaction content isn't the IP — we build our own waves. Third decline of this type; make it a standing lesson.",
    runId: "run-1",
  },
];

// ---------- Drafts ----------

export const DRAFTS: Draft[] = [
  {
    id: "draft-1",
    ideaId: "idea-2",
    ideaTitle: "Dana's bench: the day we cut from her program",
    platform: "x",
    text: "My client Dana asked for a fourth training day.\n\nWe cut to two instead.\n\n12 weeks later her bench is up 20 lb.\n\nThe limiting factor was never volume. It was recovery she didn't have room for. Strong enough for your life means programming for the life you actually have.",
    hashtags: [],
    sponsored: false,
    atomIds: ["atom-6"],
    checks: [
      {
        rule: "platform_length",
        detail: "268 of 280 characters",
        source: "X docs: 280 chars",
        pass: true,
      },
      {
        rule: "banned_phrases",
        detail: "No banned phrases found",
        source: "Your editorial rules",
        pass: true,
      },
      {
        rule: "atom_citation",
        detail: "Personal story traces to Library (Dana, atom-6)",
        source: "PostPilot grounding rule",
        pass: true,
      },
    ],
    status: "approved",
    slotDate: "2026-07-31",
  },
  {
    id: "draft-2",
    ideaId: "idea-2",
    ideaTitle: "Dana's bench: the day we cut from her program",
    platform: "linkedin",
    text: "A client story about doing less.\n\nDana came to me convinced she needed a fourth training day. Her logs said otherwise: three weeks of stalled lifts and 5-hour sleep nights.\n\nWe cut to two focused sessions a week.\n\nTwelve weeks later: bench press up 20 lb, first strict pull-up, and — her words — \"the first program I've ever finished.\"\n\nIn eight years as a physical therapist, most of the overuse injuries I saw came from people adding days on top of bad recovery. The bravest programming decision is usually subtraction.\n\nWhat's the last thing you removed from your routine that made you better?",
    hashtags: ["#strengthtraining", "#coaching"],
    sponsored: false,
    atomIds: ["atom-6", "atom-3"],
    checks: [
      {
        rule: "platform_length",
        detail: "612 of 3,000 characters",
        source: "LinkedIn docs: 3,000 chars",
        pass: true,
      },
      {
        rule: "hashtag_cap",
        detail: "2 of 4 allowed",
        source: "Your editorial rules",
        pass: true,
      },
      {
        rule: "atom_citation",
        detail: "Stories trace to Library (atom-6, atom-3)",
        source: "PostPilot grounding rule",
        pass: true,
      },
    ],
    status: "draft",
  },
  {
    id: "draft-3",
    ideaId: "idea-3",
    ideaTitle: "The index card that replaced my programming app",
    platform: "instagram",
    text: "My entire training system fits on an index card.\n\nSquat. Hinge. Push. Pull. Carry.\n\nThree hours a week, spread however your life allows. One year on this card: squat +35 lb, deadlift +50 lb, same bodyweight.\n\nSave this for the next time an app tries to sell you complexity.",
    hashtags: ["#minimalisttraining", "#strengthover30", "#3hourweek"],
    sponsored: false,
    atomIds: ["atom-5", "atom-8"],
    checks: [
      {
        rule: "platform_length",
        detail: "318 of 2,200 characters",
        source: "Instagram docs: 2,200 chars",
        pass: true,
      },
      {
        rule: "hashtag_cap",
        detail: "3 of 4 allowed",
        source: "Your editorial rules",
        pass: true,
      },
      {
        rule: "atom_citation",
        detail: "Protocol and numbers trace to Library (atom-5, atom-8)",
        source: "PostPilot grounding rule",
        pass: true,
      },
    ],
    status: "draft",
  },
  {
    id: "draft-4",
    ideaId: "idea-1",
    ideaTitle: "The meta-analysis says two sessions keep 90% of your gains",
    platform: "x",
    text: "New meta-analysis: lifters training 2x/week kept ~90% of the strength gains of 4x/week groups.\n\nEight years in a PT clinic taught me the other half: most overuse injuries I treated were 5+ day lifters on broken recovery.\n\nFrequency was never your problem. Recovery capacity is. This new supplement stack from IronFuel fixes that — use code JORDAN.",
    hashtags: [],
    sponsored: true,
    atomIds: ["atom-3"],
    checks: [
      {
        rule: "ftc_disclosure",
        detail: "Sponsored draft is missing the required \"#ad\" disclosure",
        source: "16 CFR 255 (FTC Endorsement Guides)",
        pass: false,
      },
      {
        rule: "platform_length",
        detail: "334 of 280 characters — over limit",
        source: "X docs: 280 chars",
        pass: false,
      },
      {
        rule: "atom_citation",
        detail: "Clinic stat traces to Library (atom-3)",
        source: "PostPilot grounding rule",
        pass: true,
      },
    ],
    status: "draft",
  },
  {
    id: "draft-5",
    ideaId: "idea-2",
    ideaTitle: "Dana's bench: the day we cut from her program",
    platform: "bluesky",
    text: "Client asked for a fourth training day. We cut to two. Twelve weeks later her bench is up 20 lb.\n\nThe limiting factor is almost never volume. It's the recovery your actual life leaves room for.",
    hashtags: [],
    sponsored: false,
    atomIds: ["atom-6"],
    checks: [
      {
        rule: "platform_length",
        detail: "196 of 300 characters",
        source: "Bluesky docs: 300 chars",
        pass: true,
      },
      {
        rule: "banned_phrases",
        detail: "No banned phrases found",
        source: "Your editorial rules",
        pass: true,
      },
      {
        rule: "atom_citation",
        detail: "Personal story traces to Library (atom-6)",
        source: "PostPilot grounding rule",
        pass: true,
      },
    ],
    status: "exported",
    slotDate: "2026-07-30",
  },
  {
    id: "draft-6",
    ideaId: "idea-3",
    ideaTitle: "The index card that replaced my programming app",
    platform: "x",
    text: "My programming 'app' for the last year has been an index card:\n\nSquat. Hinge. Push. Pull. Carry.\n\nThree hours a week. Squat +35 lb, deadlift +50 lb.\n\nComplexity is a product. Strength is a practice.",
    hashtags: [],
    sponsored: false,
    atomIds: ["atom-5", "atom-8"],
    checks: [
      {
        rule: "platform_length",
        detail: "199 of 280 characters",
        source: "X docs: 280 chars",
        pass: true,
      },
      {
        rule: "banned_phrases",
        detail: "No banned phrases found",
        source: "Your editorial rules",
        pass: true,
      },
      {
        rule: "atom_citation",
        detail: "Numbers trace to Library (atom-5, atom-8)",
        source: "PostPilot grounding rule",
        pass: true,
      },
    ],
    status: "posted",
    slotDate: "2026-07-28",
  },
];

// ---------- Results (self-reported) ----------

export const RESULTS: ResultLog[] = [
  {
    id: "res-1",
    draftId: "draft-6",
    title: "Index card protocol",
    platform: "x",
    postedAt: "2026-07-28",
    metrics: { views: 48200, likes: 1210, comments: 84, saves: 640, follows: 92 },
    notes: "Best save-rate this month. Specific numbers in the hook again.",
  },
  {
    id: "res-2",
    draftId: "old-1",
    title: "Red light story (origin thread)",
    platform: "x",
    postedAt: "2026-07-24",
    metrics: { views: 31500, likes: 890, comments: 132, saves: 210, follows: 71 },
    notes: "Comments full of burnout stories — narrative is landing.",
  },
  {
    id: "res-3",
    draftId: "old-2",
    title: "Track the bar, not the mirror",
    platform: "linkedin",
    postedAt: "2026-07-22",
    metrics: { views: 9800, likes: 240, comments: 45, saves: 88, follows: 12 },
  },
  {
    id: "res-4",
    draftId: "old-3",
    title: "Question hook: 'how many sets do you actually need?'",
    platform: "x",
    postedAt: "2026-07-19",
    metrics: { views: 8100, likes: 96, comments: 18, saves: 22, follows: 3 },
    notes: "Question hooks keep underperforming vs number hooks.",
  },
  {
    id: "res-5",
    draftId: "old-4",
    title: "Three good hours (newsletter promo)",
    platform: "bluesky",
    postedAt: "2026-07-17",
    metrics: { views: 4400, likes: 180, comments: 26, saves: 0, follows: 19 },
  },
];

// ---------- Growth Lead ----------

export const REVIEW: GrowthReview = {
  id: "rev-1",
  at: "2026-07-27",
  summary:
    "Number-led hooks outperform question hooks ~5x on views and 10x on saves. The burnout narrative drives the most comments and follows per view. Client-story posts are under-used relative to their performance: one in the last 14 days despite the best follow-rate. Newsletter goal is behind pace (3,180 of 5,000).",
  moves: [
    {
      id: "move-1",
      title: "Shift the mix: 2 client stories per week",
      rationale: "Best follows-per-view of any pillar; currently once a fortnight.",
      status: "accepted",
    },
    {
      id: "move-2",
      title: "Retire question hooks; default to number-led hooks",
      rationale: "5x view gap across the last 12 posts.",
      status: "accepted",
    },
    {
      id: "move-3",
      title: "Add a weekly newsletter CTA post on LinkedIn",
      rationale: "Newsletter is the lagging goal; LinkedIn drives the best click-through.",
      status: "proposed",
    },
  ],
};

export const THREADS: Thread[] = [
  {
    id: "th-1",
    title: "Planning the meta-analysis post",
    updatedAt: "2026-07-30",
    messages: [
      {
        id: "m-1",
        role: "user",
        text: "That two-sessions study is everywhere. Worth jumping on?",
        at: "2026-07-30T09:12:00",
      },
      {
        id: "m-2",
        role: "assistant",
        text: "Yes — it lands directly on your positioning. Fourteen outlets covered it in 48 hours, and \"3 day workout split\" searches are at a 12-month high, so the audience is already asking the question.\n\nI'd pair the study's 90% figure with your clinic stat (7 in 10 overuse injuries from 5+ day lifters — from the Lifting Dad interview) so the take is yours, not the journal's. Drafted as idea \"The meta-analysis says two sessions keep 90% of your gains\" in the Studio.\n\nOne flag: the IronFuel variant is sponsored, and it's currently missing your #ad disclosure — the editorial engine is holding it until that's fixed.",
        at: "2026-07-30T09:12:41",
      },
      {
        id: "m-3",
        role: "user",
        text: "Good catch. Don't run sponsored on this one at all — keep the study post clean.",
        at: "2026-07-30T09:14:05",
      },
      {
        id: "m-4",
        role: "assistant",
        text: "Done — I'll drop the sponsored variant and keep the organic X and LinkedIn drafts. Noted as a standing lesson: no sponsorships attached to research commentary.",
        at: "2026-07-30T09:14:32",
      },
    ],
  },
  {
    id: "th-2",
    title: "Newsletter growth ideas",
    updatedAt: "2026-07-25",
    messages: [
      {
        id: "m-5",
        role: "user",
        text: "Newsletter is stuck around 3,000. Ideas?",
        at: "2026-07-25T14:02:00",
      },
      {
        id: "m-6",
        role: "assistant",
        text: "Three, ranked by evidence from your own results:\n\n1. Your index-card post has the best save-rate this month — savers are subscribers who haven't been asked. Add a one-line newsletter CTA to protocol posts.\n2. The burnout narrative drives follows; issue #9 could tell the red-light story in full and be the pinned link.\n3. LinkedIn drives your best click-throughs but you post there half as often — the weekly cadence move from the last review would compound this.",
        at: "2026-07-25T14:02:58",
      },
    ],
  },
];

// ---------- Campaigns ----------

export const CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    title: "Weekly growth review",
    prompt:
      "Review goals, pillar coverage, the calendar, and logged results. Propose strategy moves with rationale.",
    cadence: "weekly",
    hourLocal: 8,
    enabled: true,
    builtIn: true,
    lastRunAt: "2026-07-27",
    lastReport:
      "Number-led hooks outperform question hooks ~5x. Client stories under-used vs performance. Newsletter behind pace — see 3 proposed moves.",
  },
  {
    id: "camp-2",
    title: "Monday week plan",
    prompt:
      "Every Monday, research the niche and propose a week of ideas balanced across pillars, honoring the current narrative arcs.",
    cadence: "weekly",
    hourLocal: 7,
    enabled: true,
    lastRunAt: "2026-07-27",
    lastReport:
      "5 ideas proposed for the week: 2 myth-busting (meta-analysis wave), 1 client story, 1 protocol visual, 1 notebook post.",
  },
  {
    id: "camp-3",
    title: "Launch: 3-hour week experiment, month 8 update",
    prompt:
      "Around the 1st, draft the monthly numbers update for the experiment log across X and the newsletter.",
    cadence: "manual",
    hourLocal: 9,
    enabled: false,
    lastRunAt: "2026-07-01",
    lastReport: "Month 7 update drafted and posted; squat +3 lb, deadlift +5 lb.",
  },
];

// ---------- Derived helpers for the mock week ----------

export const PIPELINE_COUNTS = {
  materialsToMine: MATERIALS.filter((m) => m.status !== "mined").length,
  ideasAwaiting: IDEAS.filter((i) => i.status === "proposed").length,
  draftsToApprove: DRAFTS.filter((d) => d.status === "draft").length,
  readyToExport: DRAFTS.filter((d) => d.status === "approved").length,
};

export const LATEST_INSIGHT =
  "Client stories earn your best follows-per-view but ran once in 14 days — Dana's bench post is approved and slotted for today.";
