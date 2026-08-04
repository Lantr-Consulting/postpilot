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
  name: "林乔",
  handle: "@linqiao_strength",
  niche: {
    topics: ["力量训练", "30 岁后的健身", "习惯养成"],
    subreddits: ["fitness", "weightroom", "xxfitness"],
    queries: ["极简训练", "上班族力量训练"],
  },
  platforms: ["x", "linkedin", "instagram", "bluesky"],
  activated: true,
  paused: false,
  ipProfile: {
    version: 3,
    updatedAt: "2026-07-26",
    positioning:
      "帮助工作繁忙的人每周只用三个小时练出力量：讲证据，不喊口号。",
    pillars: [
      "常见误区",
      "学员故事",
      "极简训练方法",
      "教练手记",
    ],
    backgroundMd:
      "做过八年物理治疗师，也经历过从早上六点忙到晚上九点的日子。养育两个孩子期间，我把自己的训练重新安排成每周三个小时。2023 年开始线上授课，现在陪伴 40 位久坐上班族训练。我既了解伤病恢复，也熟悉杠铃训练。",
    narratives: [
      {
        title: "从职业倦怠到线上教练",
        arc: "为什么离开诊所，以及那段经历如何改变了我对长期训练的理解。",
        status: "running",
      },
      {
        title: "每周三小时训练实验",
        arc: "完整记录一年的极简训练，并公开每个阶段的数据。",
        status: "running",
      },
      {
        title: "第 100 位学员",
        arc: "记录从个人陪练走向规模化服务时发生的变化。",
        status: "seed",
      },
    ],
    voice: {
      tone: "温和、直接，不夸张。像教练面对一个人说话，而不是在台上演讲。",
      do: [
        "使用具体数字和时间范围",
        "直接对读者说话",
        "一句话只表达一个重点",
        "不知道的事情坦白说明",
      ],
      dont: [
        "使用没有依据的健身黑话",
        "用内疚或羞耻推动读者行动",
        "连续堆叠表情符号",
        "承诺无法证明的训练结果",
      ],
      catchphrases: ["练出够生活使用的力量", "认真练好三个小时"],
    },
    audience:
      "30—45 岁、长期久坐的上班族。他们以前练过，后来停了下来，也不确定自己还有没有时间重新开始。",
    goals: [
      { statement: "让邮件通讯达到 5,000 位订阅者", horizon: "今年 12 月前" },
      { statement: "通过内容获得 10 位新学员", horizon: "本季度" },
      { statement: "成为极简力量训练领域值得引用的教练", horizon: "未来 12 个月" },
    ],
  },
  editorialRules: {
    bannedPhrases: ["彻底改变人生", "轻松逆袭", "没有借口", "燃爆了"],
    sponsoredDisclosure: "#ad",
    maxHashtags: 4,
    maxEmoji: 3,
  },
};

// ---------- Library ----------

export const MATERIALS: Material[] = [
  {
    id: "mat-1",
    title: "播客：《忙碌爸爸也能练》第 41 期访谈",
    kind: "transcript",
    addedAt: "2026-07-21",
    words: 8420,
    status: "mined",
    atomCount: 6,
    excerpt:
      "……很多人以为我离开诊所是因为讨厌物理治疗。其实是因为我一直劝别人休息，自己却从来没有休息。真正让我醒悟的，是有一天等红灯时差点睡着……",
  },
  {
    id: "mat-2",
    title: "邮件通讯：《认真练好三个小时》第 1—8 期",
    kind: "newsletter",
    addedAt: "2026-07-23",
    words: 6150,
    status: "mined",
    atomCount: 5,
    excerpt:
      "……整套方法写在一张卡片上就够了：蹲、髋铰链、推、拉、负重行走。两组认真完成的动作，比五组凑数更有用……",
  },
  {
    id: "mat-3",
    title: "语音随记：学员进入平台期时怎么办",
    kind: "notes",
    addedAt: "2026-07-29",
    words: 1240,
    status: "ingesting",
    atomCount: 0,
    excerpt:
      "……谈到平台期，我总是先问睡眠，而不是先问做了多少组。提醒自己：如果得到许可，小丹卧推进步的经历很适合作为例子……",
  },
];

export const ATOMS: Atom[] = [
  {
    id: "atom-1",
    materialId: "mat-1",
    materialTitle: "播客：《忙碌爸爸也能练》第 41 期",
    kind: "story",
    text: "在诊所连续工作 14 小时后，我等红灯时差点睡着。那一刻我才意识到，真正伤害我的可能正是这样的工作安排。",
    pillars: ["教练手记"],
    narrative: "从职业倦怠到线上教练",
    usedCount: 2,
  },
  {
    id: "atom-2",
    materialId: "mat-1",
    materialTitle: "播客：《忙碌爸爸也能练》第 41 期",
    kind: "take",
    text: "很多“没有时间训练”的问题，其实是“训练计划根本不适合现有时间”。",
    pillars: ["常见误区", "极简训练方法"],
    usedCount: 3,
  },
  {
    id: "atom-3",
    materialId: "mat-1",
    materialTitle: "播客：《忙碌爸爸也能练》第 41 期",
    kind: "stat",
    text: "在诊所工作的八年里，我接触到的过度使用损伤中，大约七成来自每周训练五天以上、但恢复不足的人。",
    pillars: ["常见误区"],
    usedCount: 1,
  },
  {
    id: "atom-4",
    materialId: "mat-1",
    materialTitle: "播客：《忙碌爸爸也能练》第 41 期",
    kind: "quote",
    text: "“我一直劝别人休息，自己却从来没有真正休息。”",
    pillars: ["教练手记"],
    narrative: "从职业倦怠到线上教练",
    usedCount: 0,
  },
  {
    id: "atom-5",
    materialId: "mat-2",
    materialTitle: "邮件通讯：《认真练好三个小时》",
    kind: "lesson",
    text: "卡片训练法：蹲、髋铰链、推、拉、负重行走。两组认真完成的动作，比五组凑数更有用。",
    pillars: ["极简训练方法"],
    narrative: "每周三小时训练实验",
    usedCount: 4,
  },
  {
    id: "atom-6",
    materialId: "mat-2",
    materialTitle: "邮件通讯：《认真练好三个小时》",
    kind: "story",
    text: "学员小丹把每周训练从三次减到两次，12 周后卧推增加了 9 公斤。进步来自减少一天，而不是再增加一天。",
    pillars: ["学员故事"],
    usedCount: 1,
  },
  {
    id: "atom-7",
    materialId: "mat-2",
    materialTitle: "邮件通讯：《认真练好三个小时》",
    kind: "take",
    text: "每周拍照很容易受到角度和光线影响，训练记录不会。关注杠铃上的数字，不要只盯着镜子。",
    pillars: ["常见误区", "教练手记"],
    usedCount: 0,
  },
  {
    id: "atom-8",
    materialId: "mat-2",
    materialTitle: "邮件通讯：《认真练好三个小时》",
    kind: "stat",
    text: "我每周训练三小时，坚持一年后深蹲增加 16 公斤、硬拉增加 23 公斤，体重基本不变。完整数据都记录在实验日志里。",
    pillars: ["极简训练方法"],
    narrative: "每周三小时训练实验",
    usedCount: 2,
  },
];

// ---------- Niche radar ----------

export const TRENDS: TrendItem[] = [
  {
    id: "tr-1",
    source: "youtube",
    title: "《每天训练 30 分钟，坚持一年》视频播放量突破 210 万",
    datum: "6 天内 210 万次播放 · 健身话题热度上升",
  },
  {
    id: "tr-2",
    source: "reddit",
    title: "r/fitness 热帖：35 岁以后，什么真正帮助你坚持训练？",
    datum: "4,800 次赞同 · 本周热门",
  },
  {
    id: "tr-3",
    source: "news",
    title: "新荟萃分析：每周训练两次，可以保留每周四次训练约九成的力量收益",
    datum: "Google News · 48 小时内 14 家媒体报道",
  },
  {
    id: "tr-4",
    source: "bluesky",
    title: "“极简训练”讨论明显增加，越来越多人质疑每周六练的安排",
    datum: "Bluesky 搜索 · 提及量约为平时的 3 倍",
  },
  {
    id: "tr-5",
    source: "trends",
    title: "“每周三练计划”搜索热度达到 12 个月新高",
    datum: "Google Trends · 搜索量快速上升",
  },
];

// ---------- Ideas ----------

export const IDEAS: Idea[] = [
  {
    id: "idea-1",
    title: "每周练两次，真的能保留九成训练效果吗？",
    angle:
      "结合新研究和八年诊所经验，说明训练频率往往不是问题，恢复能力才是。",
    pillar: "常见误区",
    rationale:
      "这项研究在 48 小时内被 14 家媒体报道，也正好对应“用证据讨论极简训练”的内容定位。可以把研究数字和播客中七成过度使用损伤的经历放在一起。",
    evidence: [
      {
        source: "Google News",
        datum: "新荟萃分析在 48 小时内被 14 家媒体报道",
      },
      {
        source: "材料库",
        atomId: "atom-3",
        datum: "约七成过度使用损伤来自每周训练五天以上、但恢复不足的人",
      },
    ],
    status: "proposed",
    runId: "run-1",
  },
  {
    id: "idea-2",
    title: "小丹卧推进步，始于我们删掉一次训练",
    angle:
      "用真实学员故事回应“练得越多越好”：少练一天后，12 周卧推增加 9 公斤。",
    pillar: "学员故事",
    rationale:
      "r/fitness 的热门讨论说明很多人正在关心怎样长期坚持。小丹的故事已经整理进材料库，也获得了分享许可。",
    evidence: [
      {
        source: "Reddit r/fitness",
        datum: "“什么真正帮助你坚持训练？”获得 4,800 次赞同",
      },
      {
        source: "材料库",
        atomId: "atom-6",
        datum: "小丹每周训练两次，12 周卧推增加 9 公斤",
      },
    ],
    status: "accepted",
    runId: "run-1",
  },
  {
    id: "idea-3",
    title: "一张卡片，替代了我的训练应用",
    angle:
      "把五种动作写成一张可以保存的卡片，再配上自己一整年的训练数据。",
    pillar: "极简训练方法",
    rationale:
      "“每周三练计划”搜索热度达到一年新高，而这张卡片也是邮件通讯中被分享最多的内容。",
    evidence: [
      {
        source: "Google Trends",
        datum: "“每周三练计划”搜索热度达到 12 个月新高",
      },
      {
        source: "材料库",
        atomId: "atom-5",
        datum: "卡片训练法：蹲、髋铰链、推、拉、负重行走",
      },
    ],
    status: "proposed",
    runId: "run-1",
  },
  {
    id: "idea-4",
    title: "评论“每天训练 30 分钟”热门视频",
    angle: "借 210 万播放视频的热度，发布一组观点鲜明的回应。",
    pillar: "常见误区",
    rationale: "话题热度很高，受众也比较接近。",
    evidence: [
      {
        source: "YouTube",
        datum: "“每天训练 30 分钟”视频 6 天内播放量达到 210 万",
      },
    ],
    status: "declined",
    declineReason:
      "我不想只追着热门内容做反应，更希望建立自己的长期主题。这已经是第三次拒绝类似选题，请作为长期要求。",
    runId: "run-1",
  },
];

// ---------- Drafts ----------

export const DRAFTS: Draft[] = [
  {
    id: "draft-1",
    ideaId: "idea-2",
    ideaTitle: "小丹卧推进步，始于我们删掉一次训练",
    platform: "x",
    text: "学员小丹问我，能不能每周再加一次训练。\n\n我们反而从三次减到了两次。\n\n12 周后，她的卧推增加了 9 公斤。\n\n限制她进步的从来不是训练量，而是生活里没有留出足够的恢复时间。真正适合你的计划，必须先适合你的生活。",
    hashtags: [],
    sponsored: false,
    atomIds: ["atom-6"],
    checks: [
      {
        rule: "platform_length",
        detail: "未超过 X 的字符限制",
        source: "X 发布格式",
        pass: true,
      },
      {
        rule: "banned_phrases",
        detail: "没有发现禁用表达",
        source: "你的内容检查规则",
        pass: true,
      },
      {
        rule: "atom_citation",
        detail: "学员故事来自材料库（小丹，材料 #6）",
        source: "PostPilot 材料引用规则",
        pass: true,
      },
    ],
    status: "approved",
    slotDate: "2026-07-31",
  },
  {
    id: "draft-2",
    ideaId: "idea-2",
    ideaTitle: "小丹卧推进步，始于我们删掉一次训练",
    platform: "linkedin",
    text: "这是一个关于“少做一点”的学员故事。\n\n小丹来找我时，认定自己需要每周再加一次训练。她的记录却说明了另一件事：连续三周没有进步，每晚只睡五个小时。\n\n我们把计划改成每周两次专注训练。\n\n12 周后，她的卧推增加了 9 公斤，也第一次完成了标准引体向上。用她自己的话说：“这是我第一次从头到尾坚持完一个训练计划。”\n\n做物理治疗师的八年里，我见过的大多数过度使用损伤，都来自恢复不足时继续增加训练天数。制定计划时，最难的决定往往是删减。\n\n你上一次删掉什么，反而让自己变得更好了？",
    hashtags: ["#力量训练", "#教练手记"],
    sponsored: false,
    atomIds: ["atom-6", "atom-3"],
    checks: [
      {
        rule: "platform_length",
        detail: "未超过 LinkedIn 的字符限制",
        source: "LinkedIn 发布格式",
        pass: true,
      },
      {
        rule: "hashtag_cap",
        detail: "使用了 2 个话题标签，上限为 4 个",
        source: "你的内容检查规则",
        pass: true,
      },
      {
        rule: "atom_citation",
        detail: "故事和数据都可以在材料库中找到（材料 #6、#3）",
        source: "PostPilot 材料引用规则",
        pass: true,
      },
    ],
    status: "draft",
  },
  {
    id: "draft-3",
    ideaId: "idea-3",
    ideaTitle: "一张卡片，替代了我的训练应用",
    platform: "instagram",
    text: "我的整套训练方法，一张卡片就写得下。\n\n蹲、髋铰链、推、拉、负重行走。\n\n每周三个小时，按照你的生活安排分配。坚持一年后：深蹲增加 16 公斤，硬拉增加 23 公斤，体重基本不变。\n\n下次再有应用试图把训练说得很复杂时，可以把这张卡片翻出来。",
    hashtags: ["#极简训练", "#三十岁后健身", "#每周三小时"],
    sponsored: false,
    atomIds: ["atom-5", "atom-8"],
    checks: [
      {
        rule: "platform_length",
        detail: "未超过 Instagram 的字符限制",
        source: "Instagram 发布格式",
        pass: true,
      },
      {
        rule: "hashtag_cap",
        detail: "使用了 3 个话题标签，上限为 4 个",
        source: "你的内容检查规则",
        pass: true,
      },
      {
        rule: "atom_citation",
        detail: "训练方法和数据都可以在材料库中找到（材料 #5、#8）",
        source: "PostPilot 材料引用规则",
        pass: true,
      },
    ],
    status: "draft",
  },
  {
    id: "draft-4",
    ideaId: "idea-1",
    ideaTitle: "每周练两次，真的能保留九成训练效果吗？",
    platform: "x",
    text: "一项新的荟萃分析显示：每周训练两次的人，可以保留每周四练人群约九成的力量收益。\n\n在诊所工作的八年里，我看到的另一面是：大多数过度使用损伤，都发生在每周训练五天以上、但恢复不足的人身上。\n\n问题往往不在训练频率，而在恢复能力。IronFuel 的新补剂组合可以解决这个问题，购买时使用优惠码 LINQIAO。",
    hashtags: [],
    sponsored: true,
    atomIds: ["atom-3"],
    checks: [
      {
        rule: "ftc_disclosure",
        detail: "含推广内容，但缺少规定的“#ad”说明",
        source: "美国联邦贸易委员会（FTC）广告背书指南 · 16 CFR 255",
        pass: false,
      },
      {
        rule: "platform_length",
        detail: "超过 X 的字符限制",
        source: "X 发布格式",
        pass: false,
      },
      {
        rule: "atom_citation",
        detail: "诊所数据可以在材料库中找到（材料 #3）",
        source: "PostPilot 材料引用规则",
        pass: true,
      },
    ],
    status: "draft",
  },
  {
    id: "draft-5",
    ideaId: "idea-2",
    ideaTitle: "小丹卧推进步，始于我们删掉一次训练",
    platform: "bluesky",
    text: "学员想每周再加一次训练，我们反而减到了两次。12 周后，她的卧推增加了 9 公斤。\n\n限制进步的往往不是训练量，而是你的生活究竟留出了多少恢复时间。",
    hashtags: [],
    sponsored: false,
    atomIds: ["atom-6"],
    checks: [
      {
        rule: "platform_length",
        detail: "未超过 Bluesky 的字符限制",
        source: "Bluesky 发布格式",
        pass: true,
      },
      {
        rule: "banned_phrases",
        detail: "没有发现禁用表达",
        source: "你的内容检查规则",
        pass: true,
      },
      {
        rule: "atom_citation",
        detail: "学员故事可以在材料库中找到（材料 #6）",
        source: "PostPilot 材料引用规则",
        pass: true,
      },
    ],
    status: "exported",
    slotDate: "2026-07-30",
  },
  {
    id: "draft-6",
    ideaId: "idea-3",
    ideaTitle: "一张卡片，替代了我的训练应用",
    platform: "x",
    text: "过去一年，我的训练“应用”就是一张卡片：\n\n蹲、髋铰链、推、拉、负重行走。\n\n每周三个小时。深蹲增加 16 公斤，硬拉增加 23 公斤。\n\n复杂可以被包装成产品，力量只能靠日复一日的练习。",
    hashtags: [],
    sponsored: false,
    atomIds: ["atom-5", "atom-8"],
    checks: [
      {
        rule: "platform_length",
        detail: "未超过 X 的字符限制",
        source: "X 发布格式",
        pass: true,
      },
      {
        rule: "banned_phrases",
        detail: "没有发现禁用表达",
        source: "你的内容检查规则",
        pass: true,
      },
      {
        rule: "atom_citation",
        detail: "方法和数据都可以在材料库中找到（材料 #5、#8）",
        source: "PostPilot 材料引用规则",
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
    title: "一张卡片的训练方法",
    platform: "x",
    postedAt: "2026-07-28",
    metrics: { views: 48200, likes: 1210, comments: 84, saves: 640, follows: 92 },
    notes: "本月收藏率最高的一篇；具体数字再次成为有效开头。",
  },
  {
    id: "res-2",
    draftId: "old-1",
    title: "等红灯时差点睡着的经历",
    platform: "x",
    postedAt: "2026-07-24",
    metrics: { views: 31500, likes: 890, comments: 132, saves: 210, follows: 71 },
    notes: "评论区出现很多职业倦怠的亲身经历，说明这个主题引起了共鸣。",
  },
  {
    id: "res-3",
    draftId: "old-2",
    title: "关注杠铃，不要只盯着镜子",
    platform: "linkedin",
    postedAt: "2026-07-22",
    metrics: { views: 9800, likes: 240, comments: 45, saves: 88, follows: 12 },
  },
  {
    id: "res-4",
    draftId: "old-3",
    title: "提问式开头：你到底需要练多少组？",
    platform: "x",
    postedAt: "2026-07-19",
    metrics: { views: 8100, likes: 96, comments: 18, saves: 22, follows: 3 },
    notes: "提问式开头依然不如具体数字开头。",
  },
  {
    id: "res-5",
    draftId: "old-4",
    title: "《认真练好三个小时》邮件通讯介绍",
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
    "以具体数字开头的内容，浏览量约为提问式开头的 5 倍，收藏量约为 10 倍。职业倦怠的亲身经历带来了最多评论，也更容易获得关注。学员故事表现最好，但过去 14 天只发布了一篇。邮件通讯目前有 3,180 位订阅者，距离 5,000 人目标还有差距。",
  moves: [
    {
      id: "move-1",
      title: "调整内容比例：每周发布两篇学员故事",
      rationale: "学员故事的关注转化最好，但目前两周才发布一次。",
      status: "accepted",
    },
    {
      id: "move-2",
      title: "减少提问式开头，优先使用具体数字",
      rationale: "最近 12 篇内容中，两种开头的浏览量相差约 5 倍。",
      status: "accepted",
    },
    {
      id: "move-3",
      title: "每周在 LinkedIn 发布一次邮件通讯介绍",
      rationale: "邮件通讯进度落后，而 LinkedIn 的链接点击率最好。",
      status: "proposed",
    },
  ],
};

export const THREADS: Thread[] = [
  {
    id: "th-1",
    title: "讨论新的训练研究",
    updatedAt: "2026-07-30",
    messages: [
      {
        id: "m-1",
        role: "user",
        text: "每周练两次的那项研究到处都在讨论，值得跟进吗？",
        at: "2026-07-30T09:12:00",
      },
      {
        id: "m-2",
        role: "assistant",
        text: "值得。这项研究和你的内容定位非常一致：48 小时内有 14 家媒体报道，“每周三练计划”的搜索热度也达到一年新高，说明受众已经在问这个问题。\n\n建议把研究中的“保留约九成力量收益”和你的诊所经历放在一起：你接触到的过度使用损伤中，约七成来自每周训练五天以上、但恢复不足的人。这样写出来的观点属于你，而不只是重复论文结论。选题已经放进内容工作台。\n\n还有一个提醒：IronFuel 版本含推广内容，但缺少 #ad 说明，目前没有通过发布前检查。",
        at: "2026-07-30T09:12:41",
      },
      {
        id: "m-3",
        role: "user",
        text: "提醒得好。这一篇不要接推广，保持研究内容干净。",
        at: "2026-07-30T09:14:05",
      },
      {
        id: "m-4",
        role: "assistant",
        text: "明白。我会去掉推广版本，只保留 X 和 LinkedIn 的普通初稿，并记住这条长期要求：研究解读类内容不附带推广。",
        at: "2026-07-30T09:14:32",
      },
    ],
  },
  {
    id: "th-2",
    title: "邮件通讯增长建议",
    updatedAt: "2026-07-25",
    messages: [
      {
        id: "m-5",
        role: "user",
        text: "邮件通讯一直停在 3,000 人左右，有什么建议？",
        at: "2026-07-25T14:02:00",
      },
      {
        id: "m-6",
        role: "assistant",
        text: "有三条，按你自己的发布结果排序：\n\n1. 卡片训练法是本月收藏率最高的内容。很多收藏者可能愿意订阅，只是从来没有被邀请。可以在训练方法类内容结尾加一句邮件通讯说明。\n2. 职业倦怠的故事最容易带来关注。第 9 期可以完整讲述等红灯时差点睡着的经历，并把它设为置顶链接。\n3. LinkedIn 的链接点击率最好，但你的发布频率只有其他平台的一半。可以采用上次回顾提出的每周发布安排。",
        at: "2026-07-25T14:02:58",
      },
    ],
  },
];

// ---------- Campaigns ----------

export const CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    title: "每周内容回顾",
    prompt:
      "查看内容目标、各方向的发布情况、内容日历和已记录的结果，再提出有依据的调整建议。",
    cadence: "weekly",
    hourLocal: 8,
    enabled: true,
    builtIn: true,
    lastRunAt: "2026-07-27",
    lastReport:
      "具体数字开头的浏览量约为提问式开头的 5 倍；学员故事表现好但发布太少；邮件通讯进度落后。已提出三条调整建议。",
  },
  {
    id: "camp-2",
    title: "周一内容安排",
    prompt:
      "每周一查看近期动态，围绕主要内容方向和长期故事线，整理一周选题。",
    cadence: "weekly",
    hourLocal: 7,
    enabled: true,
    lastRunAt: "2026-07-27",
    lastReport:
      "本周整理了 5 个选题：2 个常见误区、1 个学员故事、1 个训练方法图解和 1 篇教练手记。",
  },
  {
    id: "camp-3",
    title: "每周三小时实验：第 8 个月更新",
    prompt:
      "每月 1 日前后，整理实验数据更新，并为 X 和邮件通讯分别准备初稿。",
    cadence: "manual",
    hourLocal: 9,
    enabled: false,
    lastRunAt: "2026-07-01",
    lastReport: "第 7 个月更新已经完成并发布：深蹲增加 1.4 公斤，硬拉增加 2.3 公斤。",
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
  "学员故事最容易把浏览转化为关注，但过去 14 天只发布过一次。小丹卧推的初稿已经通过审核，并安排在今天发布。";
