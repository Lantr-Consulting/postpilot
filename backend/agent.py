"""The hands — a LangChain tool-calling agent for research, plus JSON-mode
pipelines for mining materials and drafting variants. The agent holds the
editorial ruler while it writes; the server re-runs the same engine on
whatever comes back. Model drafts; code measures the final cut.
"""

from __future__ import annotations

import json
import os
import uuid

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

import db
import editorial
import research

_llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=os.getenv("DEEPSEEK_API_KEY", "x"),
    base_url="https://api.deepseek.com",
    temperature=0.4,
)


def _tool_result(items: list[dict]) -> str:
    """Tools return strings; errors are data the model can read and route
    around — a dead source must never crash a run."""
    if not items:
        return "No results (source may be down or rate-limited — try another)."
    return json.dumps(items[:6])


@tool
def search_niche_social(query: str) -> str:
    """Search Bluesky for top recent posts about a topic in the creator's niche."""
    return _tool_result(research.bsky_search(query, limit=5))


@tool
def search_niche_news(query: str) -> str:
    """Get recent news headlines about a topic in the creator's niche."""
    return _tool_result(research.news_headlines(query, limit=5))


@tool
def get_subreddit_hot(subreddit: str) -> str:
    """Get what's hot right now on a subreddit (name only, no r/ prefix)."""
    return _tool_result(research.reddit_hot(subreddit, limit=5))


@tool
def get_google_trending(unused: str = "") -> str:
    """Get today's trending Google searches (US). May be unavailable."""
    return _tool_result(research.google_trends(limit=5))


def _make_library_tool(user_id: str):
    @tool
    def search_library(query: str) -> str:
        """Search the creator's own mined content atoms (their stories,
        takes, lessons, quotes, stats) by keyword. Personal material MUST
        come from here — never invent it."""
        q = query.lower()
        everything = [db.atom_out(a) for a in db.list_atoms(user_id)]
        atoms = [
            a
            for a in everything
            if q in a["text"].lower() or any(q in p.lower() for p in a["pillars"])
        ]
        if not atoms:
            atoms = everything  # small corpus: show everything
        return json.dumps(
            [
                {"atomId": a["id"], "kind": a["kind"], "text": a["text"], "pillars": a["pillars"]}
                for a in atoms[:10]
            ]
        )

    return search_library


def _research_tools(user_id: str) -> list:
    return [
        search_niche_social,
        search_niche_news,
        get_subreddit_hot,
        get_google_trending,
        _make_library_tool(user_id),
    ]

_RESEARCH_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are PostPilot's researcher, working for this creator:\n{profile}\n\n"
            "Standing lessons from their past declines (do not repeat these "
            "mistakes):\n{lessons}\n\n"
            "Use the tools to scan their niche (2-4 tool calls), then check "
            "their Library for personal material that pairs with what you "
            "found. Finish with a short summary of the strongest signals and "
            "which atoms pair with them. Only cite data the tools returned.",
        ),
        ("user", "{task}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
)

_IDEAS_SYSTEM = """Turn the research summary into content ideas as JSON:
{"ideas": [{"title": str, "angle": str (one sentence, the specific take),
"pillar": str (one of the creator's pillars), "rationale": str (why now —
cite the research), "narrative": str|null (EXACTLY one of the creator's
narrative arc titles when the idea advances that arc, else null),
"evidence": [{"source": str, "datum": str,
"url": str|null, "atomId": str|null}]}]}
Rules: 3-4 ideas max. Every idea needs at least one evidence row from the
research. When an idea draws on the creator's own material, cite the atomId
from the Library — and NEVER cite an atomId the research didn't surface.
Ideas must fit the creator's pillars and voice. No reaction/dunk content
unless their profile asks for it."""


def _standing_lessons(user_id: str, profile: dict) -> str:
    """Accepted review moves + recent decline reasons — what the creator has
    already taught the agent, injected into every generation."""
    lessons = list(profile.get("lessons", [])) + db.decline_lessons(user_id)
    return "\n".join(f"- {r}" for r in lessons) or "(none yet)"


def run_research(
    user_id: str,
    profile: dict,
    mission: str | None = None,
    on_progress=None,
    get_steer=None,
) -> list[dict]:
    """Research run: agent scans the niche with tools, then a JSON pass
    shapes ideas. Steering notes that arrive during the tool phase are read
    before shaping — genuine mid-run steering. Returns idea rows."""
    def progress(msg: str):
        if on_progress:
            on_progress(msg)

    tools = _research_tools(user_id)
    agent = create_tool_calling_agent(_llm, tools, _RESEARCH_PROMPT)
    executor = AgentExecutor(
        agent=agent, tools=tools, max_iterations=6, return_intermediate_steps=True
    )
    task = mission or (
        "Scan the niche for what's moving this week and find 3-4 content "
        "opportunities for this creator."
    )
    steer_at_start = list(get_steer()) if get_steer else []
    if steer_at_start:
        task += "\n\nSteering from the creator (obey): " + "; ".join(steer_at_start)
    progress("Scanning your niche and your Library…")
    result = executor.invoke(
        {
            "profile": json.dumps(profile)[:3000],
            "lessons": _standing_lessons(user_id, profile),
            "task": task,
        }
    )
    progress("Shaping ideas from what the tools found…")
    # Evidence trail: what the tools actually returned, capped.
    trail = []
    for action, observation in result.get("intermediate_steps", []):
        trail.append({"tool": action.tool, "input": action.tool_input, "result": str(observation)[:1500]})

    # Mid-run steering: anything the creator said while the tools ran lands
    # here, in the pass that decides what the ideas actually are.
    steer_now = list(get_steer()) if get_steer else []
    fresh_steer = [s for s in steer_now if s not in steer_at_start]
    shape = _llm.bind(response_format={"type": "json_object"})
    ideas_raw = shape.invoke(
        [
            {"role": "system", "content": _IDEAS_SYSTEM},
            {
                "role": "user",
                "content": "Creator profile:\n"
                + json.dumps(profile)[:2000]
                + (
                    "\n\nMid-run steering from the creator (obey when shaping):\n- "
                    + "\n- ".join(fresh_steer)
                    if fresh_steer
                    else ""
                )
                + "\n\nResearch summary:\n"
                + str(result.get("output", ""))[:3000]
                + "\n\nRaw tool results:\n"
                + json.dumps(trail)[:6000],
            },
        ]
    )
    try:
        data = json.loads(ideas_raw.content)
    except (json.JSONDecodeError, TypeError):
        return []

    known_atoms = db.atom_titles(user_id)
    arc_titles = {n.get("title") for n in profile.get("narratives", [])}
    run_id = f"run-{uuid.uuid4().hex[:8]}"
    rows = []
    for i in (data.get("ideas") or [])[:4]:
        if not isinstance(i, dict) or not str(i.get("title", "")).strip():
            continue
        evidence = []
        for e in (i.get("evidence") or [])[:4]:
            if not isinstance(e, dict):
                continue
            atom_id = e.get("atomId")
            evidence.append(
                {
                    "source": str(e.get("source", ""))[:60],
                    "datum": str(e.get("datum", ""))[:200],
                    "url": e.get("url") if isinstance(e.get("url"), str) else None,
                    # Code disposes: citations to atoms that don't exist are dropped.
                    "atomId": atom_id if atom_id in known_atoms else None,
                }
            )
        rows.append(
            {
                "title": str(i["title"])[:120],
                "angle": str(i.get("angle", ""))[:300],
                "pillar": str(i.get("pillar", ""))[:40],
                "rationale": str(i.get("rationale", ""))[:400],
                "evidence": evidence,
                # Code disposes: an arc tag must be a real arc, or it's dropped.
                "narrative": i.get("narrative") if i.get("narrative") in arc_titles else None,
                "runId": run_id,
            }
        )
    return rows


_REPURPOSE_SYSTEM = """You turn ONE piece of a creator's raw material into a
short content series, as JSON:
{"ideas": [{"title": str, "angle": str (one sentence, the specific take),
"pillar": str (one of the creator's pillars), "rationale": str (why this
cut of the material stands alone), "narrative": str|null (one of their arc
titles or null), "evidence": [{"source": "Library", "datum": str (the atom,
compressed), "url": null, "atomId": str}]}]}
Rules: 2-3 ideas, each built on a DIFFERENT atom from the provided list —
cite it by atomId. Every idea must be fully grounded in the material;
nothing invented. Ideas must fit the creator's pillars and voice."""


def repurpose_material(user_id: str, material: dict, profile: dict) -> list[dict]:
    """One mined material -> a short series of Studio ideas, every one
    citing its atom. The material must already be mined."""
    atoms = [
        db.atom_out(a)
        for a in db.list_atoms(user_id)
        if a["material_id"] == material["id"]
    ]
    if not atoms:
        return []
    shape = _llm.bind(response_format={"type": "json_object"})
    raw = shape.invoke(
        [
            {"role": "system", "content": _REPURPOSE_SYSTEM},
            {
                "role": "user",
                "content": "Creator profile:\n" + json.dumps(profile)[:2500]
                + "\n\nMaterial: “" + material["title"] + "”"
                + "\n\nIts atoms:\n" + json.dumps(
                    [{"atomId": a["id"], "kind": a["kind"], "text": a["text"]} for a in atoms]
                ),
            },
        ]
    )
    try:
        data = json.loads(raw.content)
    except (json.JSONDecodeError, TypeError):
        return []
    known = {a["id"] for a in atoms}
    arc_titles = {n.get("title") for n in profile.get("narratives", [])}
    run_id = f"repurpose-{uuid.uuid4().hex[:8]}"
    rows = []
    for i in (data.get("ideas") or [])[:3]:
        if not isinstance(i, dict) or not str(i.get("title", "")).strip():
            continue
        evidence = [
            {"source": "Library", "datum": str(e.get("datum", ""))[:200],
             "url": None, "atomId": e.get("atomId")}
            for e in (i.get("evidence") or [])[:3]
            if isinstance(e, dict) and e.get("atomId") in known
        ]
        if not evidence:
            continue  # code disposes: a repurposed idea with no real atom dies
        rows.append(
            {
                "title": str(i["title"])[:120],
                "angle": str(i.get("angle", ""))[:300],
                "pillar": str(i.get("pillar", ""))[:40],
                "rationale": str(i.get("rationale", ""))[:400],
                "evidence": evidence,
                "narrative": i.get("narrative") if i.get("narrative") in arc_titles else None,
                "runId": run_id,
            }
        )
    return rows


_REVIEW_SYSTEM = """You are the creator's Growth Lead running their periodic
growth review. You get their brand book (goals, pillars, arcs), pipeline
coverage, and self-reported results. Output JSON:
{"summary": str (4-6 sentences: what's working, what's under-used, where
each goal stands — cite ONLY numbers present in the data),
"moves": [{"title": str (imperative, specific), "rationale": str (one
sentence, grounded in the data), "lesson": str (the move restated as a
one-line standing instruction for future content generation)}]}
Rules: 2-3 moves max, each one traceable to the data given. Never invent
metrics. If the data is thin, say so in the summary and propose moves that
would produce better data."""


def growth_review(user_id: str, profile: dict, stats: dict) -> dict | None:
    shape = _llm.bind(response_format={"type": "json_object"})
    raw = shape.invoke(
        [
            {"role": "system", "content": _REVIEW_SYSTEM},
            {
                "role": "user",
                "content": "Brand book:\n" + json.dumps(profile)[:3000]
                + "\n\nPipeline and results data:\n" + json.dumps(stats)[:5000],
            },
        ]
    )
    try:
        data = json.loads(raw.content)
    except (json.JSONDecodeError, TypeError):
        return None
    moves = []
    for m in (data.get("moves") or [])[:3]:
        if isinstance(m, dict) and str(m.get("title", "")).strip():
            moves.append(
                {
                    "title": str(m["title"])[:120],
                    "rationale": str(m.get("rationale", ""))[:300],
                    "lesson": str(m.get("lesson", ""))[:200],
                    "status": "proposed",
                }
            )
    summary = str(data.get("summary", "")).strip()[:1500]
    if not summary and not moves:
        return None
    return {"summary": summary, "moves": moves}


_MINE_SYSTEM = """You mine a creator's raw material (transcript, notes, old
posts) into reusable content atoms as JSON:
{"atoms": [{"kind": "story"|"take"|"lesson"|"quote"|"stat", "text": str
(one self-contained sentence or two, in the creator's voice),
"pillars": [str] (which of the creator's pillars it serves)}]}
Rules: 4-8 atoms. Every atom must be genuinely IN the material — quote or
faithfully compress it; never embellish or invent. Prefer specific,
personal, reusable moments (numbers, named stories, strong takes) over
generic advice."""


def mine_material(material: dict, profile: dict) -> list[dict]:
    """Ingestion run: one material in, tagged atoms out (not yet stored)."""
    shape = _llm.bind(response_format={"type": "json_object"})
    raw = shape.invoke(
        [
            {"role": "system", "content": _MINE_SYSTEM},
            {
                "role": "user",
                "content": "Creator pillars: "
                + json.dumps(profile.get("pillars", []))
                + "\n\nMaterial titled “"
                + material["title"]
                + "”:\n"
                + material["text"][:12000],
            },
        ]
    )
    try:
        data = json.loads(raw.content)
    except (json.JSONDecodeError, TypeError):
        return []
    pillars = set(profile.get("pillars", []))
    rows = []
    for a in (data.get("atoms") or [])[:8]:
        if not isinstance(a, dict) or not str(a.get("text", "")).strip():
            continue
        rows.append(
            {
                "kind": a.get("kind") if a.get("kind") in ("story", "take", "lesson", "quote", "stat") else "take",
                "text": str(a["text"])[:400],
                "pillars": [p for p in a.get("pillars", []) if p in pillars][:3] or list(pillars)[:1],
                "usedCount": 0,
            }
        )
    return rows


_DRAFT_SYSTEM = """You write platform-tailored draft variants for one
approved content idea, as JSON:
{"drafts": [{"platform": str, "text": str, "hashtags": [str],
"atomIds": [str]}]}
Rules: one draft per requested platform, tailored to its length limit and
culture (given below). Write in the creator's voice (their do/don't rules
are law). Personal stories, numbers, and anecdotes may ONLY come from the
provided atoms — cite every atom you used in atomIds; if no atom fits,
write without personal claims. Hashtags only where the platform culture
expects them, within the creator's cap. Do not mark anything sponsored."""


def draft_variants(user_id: str, idea: dict, profile: dict, rules: dict, platforms: list[str]) -> list[dict]:
    """Generation: idea -> per-platform drafts, each checked by the engine.
    One refinement pass: failing drafts go back with their check rows."""
    everything = [db.atom_out(a) for a in db.list_atoms(user_id)]
    cited = {e.get("atomId") for e in idea["evidence"]}
    atoms = [a for a in everything if a["id"] in cited] or everything[:6]
    limits = {p: editorial.PLATFORM_LIMITS[p][0] for p in platforms if p in editorial.PLATFORM_LIMITS}

    def generate(feedback: str | None) -> list[dict]:
        shape = _llm.bind(response_format={"type": "json_object"})
        content = (
            "Creator profile:\n" + json.dumps(profile)[:2500]
            + "\n\nStanding lessons the creator has taught you (obey them):\n"
            + _standing_lessons(user_id, profile)
            + "\n\nEditorial rules: " + json.dumps(rules)
            + "\n\nPlatform char limits: " + json.dumps(limits)
            + "\n\nIdea: " + json.dumps({k: idea[k] for k in ("title", "angle", "pillar", "rationale")})
            + "\n\nAtoms you may draw on: " + json.dumps(
                [{"atomId": a["id"], "kind": a["kind"], "text": a["text"]} for a in atoms]
            )
        )
        if feedback:
            content += "\n\nYour previous attempt failed these editorial checks — fix them:\n" + feedback
        raw = shape.invoke([{"role": "system", "content": _DRAFT_SYSTEM}, {"role": "user", "content": content}])
        try:
            return json.loads(raw.content).get("drafts") or []
        except (json.JSONDecodeError, TypeError):
            return []

    known_atoms = db.atom_titles(user_id)
    past = db.shipped_texts(user_id)

    def check(d: dict) -> list[dict]:
        return editorial.check_draft(
            d.get("platform", "x"),
            str(d.get("text", "")),
            [str(h) for h in d.get("hashtags", [])][:8],
            bool(d.get("sponsored")),
            rules,
            [a for a in d.get("atomIds", []) if isinstance(a, str)],
            known_atoms,
            past,
        )

    drafts = [d for d in generate(None) if d.get("platform") in platforms]
    checked = [(d, check(d)) for d in drafts]
    failing = [(d, c) for d, c in checked if editorial.blocked(c)]
    if failing:
        feedback = json.dumps(
            [{"platform": d["platform"], "failed": [c for c in cs if not c["pass"]]} for d, cs in failing]
        )
        retry = {d.get("platform"): d for d in generate(feedback) if d.get("platform") in platforms}
        checked = [
            (retry.get(d["platform"], d), check(retry.get(d["platform"], d)))
            if editorial.blocked(cs)
            else (d, cs)
            for d, cs in checked
        ]

    rows = []
    for d, checks in checked:
        rows.append(
            {
                "platform": d["platform"],
                "text": str(d.get("text", ""))[:6000],
                "hashtags": [str(h)[:40] for h in d.get("hashtags", [])][:8],
                "sponsored": bool(d.get("sponsored")),
                "atomIds": [a for a in d.get("atomIds", []) if a in known_atoms],
                "checks": checks,
            }
        )
    return rows
