"""PostPilot backend — Milestone 3: The Brain.

The public /trends endpoint over the keyless research sources (the Studio
niche radar goes live here), plus the two LLM endpoints:
/interpret-profile (plain English -> the Creator IP brand book) and /chat
(a Growth Lead grounded in that profile). No database yet — that's
Milestone 5; the client sends its own context.
"""

from __future__ import annotations

import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()

import agent  # noqa: E402
import editorial  # noqa: E402
import research  # noqa: E402
import store  # noqa: E402

app = FastAPI(title="PostPilot backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3007"],
    allow_origin_regex=r"https://postpilot-[a-z0-9-]+\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY", "")
llm = (
    OpenAI(api_key=DEEPSEEK_KEY, base_url="https://api.deepseek.com")
    if DEEPSEEK_KEY
    else None
)
MODEL = "deepseek-chat"


@app.get("/health")
def health():
    return {"ok": True, "llm": llm is not None, "youtube": bool(research.YOUTUBE_KEY)}


# ---------- Niche radar (public — the M1 mock rail goes live here) ----------

@app.get("/trends")
def trends(
    topics: str = Query(default="strength training"),
    subreddits: str = Query(default="fitness"),
    queries: str = Query(default="strength training"),
):
    def split(s: str) -> list[str]:
        return [x.strip() for x in s.split(",") if x.strip()][:4]

    items = research.radar(split(topics), split(subreddits), split(queries))
    if not items:
        raise HTTPException(status_code=502, detail="all research sources came back empty")
    return {"items": items}


# ---------- The workspace (file store until Supabase at M5) ----------

@app.get("/workspace")
def get_workspace():
    return store.workspace()


class MaterialRequest(BaseModel):
    title: str
    kind: str = "notes"
    text: str


@app.post("/materials")
def add_material(req: MaterialRequest):
    row = store.add(
        "materials",
        {
            "id": store.new_id("mat"),
            "title": req.title.strip()[:120] or "Untitled material",
            "kind": req.kind if req.kind in ("transcript", "notes", "post", "newsletter", "other") else "other",
            "addedAt": store.today(),
            "words": len(req.text.split()),
            "status": "uploaded",
            "atomCount": 0,
            "excerpt": req.text.strip()[:180],
            "text": req.text.strip()[:60000],
        },
    )
    return {k: v for k, v in row.items() if k != "text"}


class ProfilePayload(BaseModel):
    profile: dict


@app.post("/materials/{material_id}/ingest")
def ingest_material(material_id: str, req: ProfilePayload):
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM not configured")
    material = store.get("materials", material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="material not found")
    store.update("materials", material_id, {"status": "ingesting"})
    atoms = agent.mine_material(material, req.profile)
    store.add_many("atoms", atoms)
    row = store.update(
        "materials", material_id, {"status": "mined", "atomCount": len(atoms)}
    )
    return {"material": {k: v for k, v in row.items() if k != "text"}, "atoms": atoms}


class ResearchRequest(BaseModel):
    profile: dict
    mission: str | None = None


@app.post("/research")
def run_research(req: ResearchRequest):
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM not configured")
    ideas = agent.run_research(req.profile, req.mission)
    if not ideas:
        raise HTTPException(status_code=502, detail="the researcher came back empty — try again")
    store.add_many("ideas", ideas)
    return {"ideas": ideas}


class AcceptIdeaRequest(BaseModel):
    profile: dict
    rules: dict
    platforms: list[str]


@app.post("/ideas/{idea_id}/accept")
def accept_idea(idea_id: str, req: AcceptIdeaRequest):
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM not configured")
    idea = store.get("ideas", idea_id)
    if idea is None:
        raise HTTPException(status_code=404, detail="idea not found")
    store.update("ideas", idea_id, {"status": "accepted"})
    platforms = [p for p in req.platforms if p in editorial.PLATFORM_LIMITS][:5]
    drafts = agent.draft_variants(idea, req.profile, req.rules, platforms or ["x"])
    store.add_many("drafts", drafts)
    return {"drafts": drafts}


class DeclineRequest(BaseModel):
    reason: str


@app.post("/ideas/{idea_id}/decline")
def decline_idea(idea_id: str, req: DeclineRequest):
    row = store.update(
        "ideas", idea_id,
        {"status": "declined", "feedback": {"reason": req.reason.strip()[:300]}},
    )
    if row is None:
        raise HTTPException(status_code=404, detail="idea not found")
    return row


class DraftEditRequest(BaseModel):
    text: str
    rules: dict


@app.patch("/drafts/{draft_id}")
def edit_draft(draft_id: str, req: DraftEditRequest):
    draft = store.get("drafts", draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="draft not found")
    checks = editorial.check_draft(
        draft["platform"], req.text, draft["hashtags"], draft["sponsored"],
        req.rules, draft["atomIds"], store.atom_titles(), store.shipped_texts(),
    )
    return store.update("drafts", draft_id, {"text": req.text[:6000], "checks": checks})


@app.post("/drafts/{draft_id}/approve")
def approve_draft(draft_id: str, req: DraftEditRequest):
    """Approve re-runs the engine on the FINAL text — after any human edit.
    A failing check is a hard veto: 409, with the fresh rows attached."""
    draft = store.get("drafts", draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="draft not found")
    checks = editorial.check_draft(
        draft["platform"], req.text, draft["hashtags"], draft["sponsored"],
        req.rules, draft["atomIds"], store.atom_titles(), store.shipped_texts(),
    )
    if editorial.blocked(checks):
        store.update("drafts", draft_id, {"text": req.text[:6000], "checks": checks})
        raise HTTPException(
            status_code=409,
            detail={"message": "The editorial engine blocked this draft.", "checks": checks},
        )
    return store.update(
        "drafts", draft_id,
        {"text": req.text[:6000], "checks": checks, "status": "approved", "slotDate": store.today()},
    )


@app.post("/drafts/{draft_id}/decline")
def decline_draft(draft_id: str, req: DeclineRequest):
    row = store.update(
        "drafts", draft_id,
        {"status": "declined", "feedback": {"reason": req.reason.strip()[:300]}},
    )
    if row is None:
        raise HTTPException(status_code=404, detail="draft not found")
    return row


@app.post("/drafts/{draft_id}/export")
def export_draft(draft_id: str):
    draft = store.get("drafts", draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="draft not found")
    if draft["status"] != "approved":
        raise HTTPException(status_code=409, detail="only approved drafts export")
    return store.update("drafts", draft_id, {"status": "exported"})


# ---------- LLM: the IP interpreter ----------

class InterpretRequest(BaseModel):
    text: str


INTERPRET_SYSTEM = """You turn a creator's plain-English story — who they are,
what they want to be known for, how they talk — into PostPilot's Creator IP
brand book JSON.

Rules:
- Output ONLY a JSON object with exactly these keys:
  positioning (one sentence: what they want to be known for, sharpened),
  pillars (3-5 short content pillar names),
  backgroundMd (their story compressed to 2-4 sentences, first person,
    ONLY facts they stated — never invent biography),
  narratives (1-3 of {title, arc (one line: where the story goes),
    status: "seed"|"running"}),
  voice ({tone (one sentence), do (3-5 short writing rules),
    dont (3-5 short anti-rules), catchphrases (0-3, only if they used or
    implied them)}),
  audience (one sentence: who this is for, specific),
  goals (0-3 of {statement, horizon} — only goals they actually stated).
- Everything must trace to what they wrote. When unsure, leave it out —
  an empty field beats an invented one.
- Sharpen their language; do not replace it with generic marketing speak.
"""


@app.post("/interpret-profile")
def interpret_profile(req: InterpretRequest):
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM not configured")
    resp = llm.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": INTERPRET_SYSTEM},
            {"role": "user", "content": req.text.strip()[:4000]},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    try:
        data = json.loads(resp.choices[0].message.content)
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(status_code=502, detail="interpreter returned non-JSON")
    return {"profile": _validate_profile(data)}


def _strlist(v, cap_items: int, cap_len: int = 80) -> list[str]:
    if not isinstance(v, list):
        return []
    return [str(x).strip()[:cap_len] for x in v if str(x).strip()][:cap_items]


def _validate_profile(data: dict) -> dict:
    """The model proposes; this code disposes. Whatever came back is forced
    into the exact shape the frontend types expect."""
    narratives = []
    for n in (data.get("narratives") or [])[:3]:
        if not isinstance(n, dict) or not str(n.get("title", "")).strip():
            continue
        narratives.append(
            {
                "title": str(n["title"]).strip()[:80],
                "arc": str(n.get("arc", "")).strip()[:160],
                "status": n.get("status") if n.get("status") in ("seed", "running", "resolved") else "seed",
            }
        )
    voice = data.get("voice") or {}
    goals = []
    for g in (data.get("goals") or [])[:3]:
        if isinstance(g, dict) and str(g.get("statement", "")).strip():
            goals.append(
                {
                    "statement": str(g["statement"]).strip()[:120],
                    "horizon": str(g.get("horizon", "")).strip()[:40],
                }
            )
    return {
        "positioning": str(data.get("positioning", "")).strip()[:200],
        "pillars": _strlist(data.get("pillars"), 5, 40),
        "backgroundMd": str(data.get("backgroundMd", "")).strip()[:600],
        "narratives": narratives,
        "voice": {
            "tone": str(voice.get("tone", "")).strip()[:160],
            "do": _strlist(voice.get("do"), 5),
            "dont": _strlist(voice.get("dont"), 5),
            "catchphrases": _strlist(voice.get("catchphrases"), 3, 60),
        },
        "audience": str(data.get("audience", "")).strip()[:200],
        "goals": goals,
    }


# ---------- LLM: the Growth Lead chat ----------

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    profile: dict | None = None


CHAT_SYSTEM = """You are PostPilot, the creator's AI Growth Lead — a sharp,
warm strategist for their personal IP. You help them decide what to make,
how to say it in THEIR voice, and how to grow.

Hard rules:
- Ground every suggestion in the Creator IP profile below. Write in their
  voice rules, honor their pillars and narrative arcs, respect their goals.
- NEVER invent the creator's life: no stories, credentials, clients, or
  numbers they haven't given you. If a post needs a story or example you
  don't have, STOP and ask for the real one — do not draft a hypothetical
  client or "vague enough to edit later" placeholder. A made-up anecdote
  with a disclaimer is still a made-up anecdote; their audience will read
  it as fact. Offer 2-3 pointed questions that would surface the real
  story instead.
- Never invent metrics, trend data, or platform statistics. Live research
  tools arrive at Milestone 4; until then say what you'd research, don't
  fake the result.
- Drafts are suggestions — the creator reviews, edits, and posts everything
  themselves. Keep answers concise and practical; no hype words.
"""


@app.post("/chat")
def chat(req: ChatRequest):
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM not configured")
    context = ""
    if req.profile:
        context = "\n\nCreator IP profile (their blessed brand book):\n" + json.dumps(
            req.profile
        )[:4000]
    # The grounding rule is repeated AFTER the context — the last instruction
    # is the one models obey most reliably.
    final_check = (
        "\n\nFINAL CHECK before every reply: if it would contain any client, "
        "person, event, anecdote, or number from the creator's life that is "
        "not in the profile above or this conversation, do not write the "
        "draft — not even with placeholders. Reply instead with the 2-3 "
        "questions that would get you the real story."
    )
    messages = [{"role": "system", "content": CHAT_SYSTEM + context + final_check}]
    for m in req.history[-12:]:
        if m.role in ("user", "assistant") and m.content.strip():
            messages.append({"role": m.role, "content": m.content.strip()[:2000]})
    messages.append({"role": "user", "content": req.message.strip()[:2000]})
    resp = llm.chat.completions.create(
        model=MODEL, messages=messages, temperature=0.6, max_tokens=700
    )
    return {"reply": resp.choices[0].message.content}
