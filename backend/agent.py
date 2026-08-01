"""The hands — a LangChain tool-calling agent for research, plus JSON-mode
pipelines for mining materials and drafting variants. The agent holds the
editorial ruler while it writes; the server re-runs the same engine on
whatever comes back. Model drafts; code measures the final cut.
"""

from __future__ import annotations

import json
import os

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

import editorial
import research
import store

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


@tool
def search_library(query: str) -> str:
    """Search the creator's own mined content atoms (their stories, takes,
    lessons, quotes, stats) by keyword. Personal material MUST come from
    here — never invent it."""
    q = query.lower()
    atoms = [
        a
        for a in store.workspace()["atoms"]
        if q in a["text"].lower() or any(q in p.lower() for p in a["pillars"])
    ]
    if not atoms:
        atoms = store.workspace()["atoms"]  # small corpus: show everything
    return json.dumps(
        [
            {"atomId": a["id"], "kind": a["kind"], "text": a["text"], "pillars": a["pillars"]}
            for a in atoms[:10]
        ]
    )


RESEARCH_TOOLS = [
    search_niche_social,
    search_niche_news,
    get_subreddit_hot,
    get_google_trending,
    search_library,
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
cite the research), "evidence": [{"source": str, "datum": str,
"url": str|null, "atomId": str|null}]}]}
Rules: 3-4 ideas max. Every idea needs at least one evidence row from the
research. When an idea draws on the creator's own material, cite the atomId
from the Library — and NEVER cite an atomId the research didn't surface.
Ideas must fit the creator's pillars and voice. No reaction/dunk content
unless their profile asks for it."""


def run_research(profile: dict, mission: str | None = None) -> list[dict]:
    """Research run: agent scans the niche with tools, then a JSON pass
    shapes ideas. Returns proposed idea rows (not yet stored)."""
    agent = create_tool_calling_agent(_llm, RESEARCH_TOOLS, _RESEARCH_PROMPT)
    executor = AgentExecutor(
        agent=agent, tools=RESEARCH_TOOLS, max_iterations=6, return_intermediate_steps=True
    )
    lessons = store.decline_lessons()
    task = mission or (
        "Scan the niche for what's moving this week and find 3-4 content "
        "opportunities for this creator."
    )
    result = executor.invoke(
        {
            "profile": json.dumps(profile)[:3000],
            "lessons": "\n".join(f"- {r}" for r in lessons) or "(none yet)",
            "task": task,
        }
    )
    # Evidence trail: what the tools actually returned, capped.
    trail = []
    for action, observation in result.get("intermediate_steps", []):
        trail.append({"tool": action.tool, "input": action.tool_input, "result": str(observation)[:1500]})

    shape = _llm.bind(response_format={"type": "json_object"})
    ideas_raw = shape.invoke(
        [
            {"role": "system", "content": _IDEAS_SYSTEM},
            {
                "role": "user",
                "content": "Creator profile:\n"
                + json.dumps(profile)[:2000]
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

    known_atoms = store.atom_titles()
    run_id = store.new_id("run")
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
                "id": store.new_id("idea"),
                "title": str(i["title"])[:120],
                "angle": str(i.get("angle", ""))[:300],
                "pillar": str(i.get("pillar", ""))[:40],
                "rationale": str(i.get("rationale", ""))[:400],
                "evidence": evidence,
                "status": "proposed",
                "runId": run_id,
            }
        )
    return rows


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
                "id": store.new_id("atom"),
                "materialId": material["id"],
                "materialTitle": material["title"],
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


def draft_variants(idea: dict, profile: dict, rules: dict, platforms: list[str]) -> list[dict]:
    """Generation: idea -> per-platform drafts, each checked by the engine.
    One refinement pass: failing drafts go back with their check rows."""
    atoms = [a for a in store.workspace()["atoms"] if a["id"] in {e.get("atomId") for e in idea["evidence"]}]
    if not atoms:
        atoms = store.workspace()["atoms"][:6]
    limits = {p: editorial.PLATFORM_LIMITS[p][0] for p in platforms if p in editorial.PLATFORM_LIMITS}

    def generate(feedback: str | None) -> list[dict]:
        shape = _llm.bind(response_format={"type": "json_object"})
        content = (
            "Creator profile:\n" + json.dumps(profile)[:2500]
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

    known_atoms = store.atom_titles()
    past = store.shipped_texts()

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
                "id": store.new_id("draft"),
                "ideaId": idea["id"],
                "ideaTitle": idea["title"],
                "platform": d["platform"],
                "text": str(d.get("text", ""))[:6000],
                "hashtags": [str(h)[:40] for h in d.get("hashtags", [])][:8],
                "sponsored": bool(d.get("sponsored")),
                "atomIds": [a for a in d.get("atomIds", []) if a in known_atoms],
                "checks": checks,
                "status": "draft",
                "slotDate": None,
            }
        )
    return rows
