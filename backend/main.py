"""PostPilot backend — Milestone 5: Memory & accounts.

Supabase behind everything: one creator per user, RLS read-own, all writes
through this backend's service key. The M4 file store is gone; endpoint
shapes survived. The creator's profile and editorial rules now live
server-side — clients send tokens, not context.
"""

from __future__ import annotations

import json
import os
import threading
import time
from datetime import date, datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()  # must run before auth/db read SUPABASE_* at import time

import agent  # noqa: E402
import auth  # noqa: E402
import db  # noqa: E402
import editorial  # noqa: E402
import research  # noqa: E402

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

# New creators start EMPTY and inactive: tell your story -> review the
# interpreted brand book -> explicit Activate. The rules ship with teeth on.
DEFAULTS = {
    "ipProfile": {
        "positioning": "",
        "pillars": [],
        "backgroundMd": "",
        "narratives": [],
        "voice": {"tone": "", "do": [], "dont": [], "catchphrases": []},
        "audience": "",
        "goals": [],
    },
    "editorialRules": {
        "bannedPhrases": ["game-changer", "crushing it"],
        "sponsoredDisclosure": "#ad",
        "maxHashtags": 4,
        "maxEmoji": 3,
    },
    "platforms": ["x", "linkedin", "instagram", "bluesky"],
    "niche": {"topics": [], "subreddits": [], "queries": []},
}


@app.get("/health")
def health():
    return {"ok": True, "llm": llm is not None, "youtube": bool(research.YOUTUBE_KEY)}


def _creator(user: dict) -> dict:
    return db.ensure_creator(user["id"], user["email"], DEFAULTS)


def _require_active(creator: dict) -> None:
    if not creator["activated"]:
        raise HTTPException(status_code=403, detail="请先确认并启用内容档案，启用前不会生成内容。")
    if creator["paused"]:
        raise HTTPException(status_code=403, detail="PostPilot 已暂停，请在设置中恢复任务。")


# ---------- Account ----------

@app.get("/me")
def me(user: dict = Depends(auth.current_user)):
    return {**db.creator_out(_creator(user)), "email": user["email"]}


class SettingsRequest(BaseModel):
    editorialRules: dict | None = None
    platforms: list[str] | None = None
    niche: dict | None = None
    paused: bool | None = None


@app.patch("/me/settings")
def me_settings(req: SettingsRequest, user: dict = Depends(auth.current_user)):
    _creator(user)
    fields = {}
    if req.editorialRules is not None:
        fields["editorial_rules"] = {
            "bannedPhrases": [str(p).strip().lower()[:60] for p in req.editorialRules.get("bannedPhrases", [])][:30],
            "sponsoredDisclosure": str(req.editorialRules.get("sponsoredDisclosure", "#ad"))[:20],
            "maxHashtags": max(0, min(10, int(req.editorialRules.get("maxHashtags", 4)))),
            "maxEmoji": max(0, min(10, int(req.editorialRules.get("maxEmoji", 3)))),
        }
    if req.platforms is not None:
        fields["platforms"] = [p for p in req.platforms if p in editorial.PLATFORM_LIMITS][:5]
    if req.niche is not None:
        fields["niche"] = {
            "topics": [str(t)[:60] for t in req.niche.get("topics", [])][:4],
            "subreddits": [str(s)[:40] for s in req.niche.get("subreddits", [])][:4],
            "queries": [str(q)[:60] for q in req.niche.get("queries", [])][:4],
        }
    if req.paused is not None:
        fields["paused"] = bool(req.paused)
    if not fields:
        raise HTTPException(status_code=400, detail="没有需要更新的内容")
    return db.creator_out(db.update_creator(user["id"], fields))


@app.post("/me/activate")
def me_activate(user: dict = Depends(auth.current_user)):
    creator = _creator(user)
    if not creator["ip_profile"].get("positioning"):
        raise HTTPException(status_code=409, detail="请先介绍自己并生成内容档案，然后再启用。")
    return db.creator_out(db.update_creator(user["id"], {"activated": True}))


@app.get("/me/versions")
def me_versions(user: dict = Depends(auth.current_user)):
    _creator(user)
    return {"versions": db.list_versions(user["id"])}


@app.post("/me/versions/{version}/restore")
def me_restore_version(version: int, user: dict = Depends(auth.current_user)):
    creator = _creator(user)
    old = db.get_version(user["id"], version)
    if old is None:
        raise HTTPException(status_code=404, detail="没有找到这个版本")
    # Restoring is itself a new version — history never rewrites.
    db.snapshot_version(user["id"], creator["ip_version"], creator["ip_profile"])
    row = db.update_creator(user["id"], {
        "ip_profile": old["profile"],
        "ip_version": creator["ip_version"] + 1,
        "activated": False,  # a restored book still needs your blessing
    })
    return db.creator_out(row)


# ---------- Async runs: claim in the DB, work in a thread, poll to watch ----------

def _start_run(user: dict, kind: str, worker, material_id: str | None = None) -> dict:
    """Claim the per-user lock (a pp_runs insert) and hand the work to a
    background thread. The client gets the run row back immediately and
    polls /runs/{id}; progress and steering live in the row."""
    run = db.claim_run(user["id"], kind, material_id)
    if run is None:
        raise HTTPException(
            status_code=409,
            detail="内容顾问正在运行任务，可以补充要求或等待任务完成。",
        )
    run_id = run["id"]
    user_id = user["id"]

    def progress(msg: str):
        db.update_run(user_id, run_id, {"progress": msg[:200]})

    def get_steer() -> list[str]:
        row = db.get_run(user_id, run_id)
        return row["steer"] if row else []

    def wrapped():
        db.update_run(user_id, run_id, {"status": "running"})
        try:
            report = worker(progress, get_steer)
            db.update_run(user_id, run_id, {"status": "done", "progress": "", "report": report[:500]})
        except Exception as e:  # a failed run must release the lock, always
            db.update_run(user_id, run_id, {"status": "failed", "progress": "", "report": str(e)[:500]})

    threading.Thread(target=wrapped, daemon=True).start()
    return db.run_out(run)


@app.get("/runs/live")
def runs_live(user: dict = Depends(auth.current_user)):
    run = db.live_run(user["id"])
    return {"run": db.run_out(run) if run else None}


@app.get("/runs/{run_id}")
def run_status(run_id: str, user: dict = Depends(auth.current_user)):
    run = db.get_run(user["id"], run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="没有找到这个任务")
    return db.run_out(run)


class SteerRequest(BaseModel):
    note: str


@app.post("/runs/{run_id}/steer")
def steer_run(run_id: str, req: SteerRequest, user: dict = Depends(auth.current_user)):
    if not req.note.strip():
        raise HTTPException(status_code=400, detail="补充要求不能为空")
    run = db.add_steer(user["id"], run_id, req.note.strip())
    if run is None:
        raise HTTPException(status_code=409, detail="这个任务已经完成")
    return db.run_out(run)


# ---------- Niche radar (public) ----------

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
        raise HTTPException(status_code=502, detail="暂时没有从公开来源找到可用内容")
    return {"items": items}


# ---------- The workspace ----------

@app.get("/workspace")
def get_workspace(user: dict = Depends(auth.current_user)):
    _creator(user)
    return {
        "materials": [db.material_out(m) for m in db.list_materials(user["id"])],
        "atoms": [db.atom_out(a) for a in db.list_atoms(user["id"])],
        "ideas": [db.idea_out(i) for i in db.list_ideas(user["id"])],
        "drafts": [db.draft_out(d) for d in db.list_drafts(user["id"])],
    }


class MaterialRequest(BaseModel):
    title: str
    kind: str = "notes"
    text: str


@app.post("/materials")
def add_material(req: MaterialRequest, user: dict = Depends(auth.current_user)):
    _creator(user)
    row = db.create_material(user["id"], {
        "title": req.title.strip()[:120] or "Untitled material",
        "kind": req.kind if req.kind in ("transcript", "notes", "post", "newsletter", "other") else "other",
        "words": len(req.text.split()),
        "excerpt": req.text.strip()[:180],
        "body": req.text.strip()[:60000],
    })
    return db.material_out(row)


@app.post("/materials/{material_id}/ingest")
def ingest_material(material_id: str, user: dict = Depends(auth.current_user)):
    if llm is None:
        raise HTTPException(status_code=503, detail="AI 服务尚未配置")
    creator = _creator(user)
    _require_active(creator)
    material = db.get_material(user["id"], material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="没有找到这份材料")
    user_id = user["id"]

    def worker(progress, get_steer):
        progress(f"正在整理“{material['title']}”…")
        db.update_material(user_id, material_id, {"status": "ingesting"})
        try:
            mined = agent.mine_material(
                {"id": material["id"], "title": material["title"], "text": material["body"]},
                creator["ip_profile"],
            )
            atoms = db.create_atoms(user_id, material, mined)
            db.update_material(user_id, material_id, {"status": "mined", "atom_count": len(atoms)})
            return f"已从“{material['title']}”整理出 {len(atoms)} 条可引用材料。"
        except Exception:
            db.update_material(user_id, material_id, {"status": "uploaded"})
            raise

    return _start_run(user, "ingestion", worker, material_id=material_id)


@app.post("/materials/{material_id}/repurpose")
def repurpose_material(material_id: str, user: dict = Depends(auth.current_user)):
    if llm is None:
        raise HTTPException(status_code=503, detail="AI 服务尚未配置")
    creator = _creator(user)
    _require_active(creator)
    material = db.get_material(user["id"], material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="没有找到这份材料")
    if material["status"] != "mined":
        raise HTTPException(status_code=409, detail="请先整理这份材料")
    user_id = user["id"]

    def worker(progress, get_steer):
        progress(f"正在从“{material['title']}”寻找选题…")
        ideas = agent.repurpose_material(user_id, material, creator["ip_profile"])
        if not ideas:
            raise RuntimeError("repurposing came back empty — try again")
        db.create_ideas(user_id, ideas)
        return f"已从“{material['title']}”整理出 {len(ideas)} 个选题，并放进内容工作台。"

    return _start_run(user, "repurpose", worker, material_id=material_id)


class ResearchRequest(BaseModel):
    mission: str | None = None


@app.post("/research")
def run_research(req: ResearchRequest, user: dict = Depends(auth.current_user)):
    if llm is None:
        raise HTTPException(status_code=503, detail="AI 服务尚未配置")
    creator = _creator(user)
    _require_active(creator)
    profile = {**creator["ip_profile"], "niche": creator["niche"]}
    user_id = user["id"]
    mission = req.mission

    def worker(progress, get_steer):
        return _research_and_store(user_id, profile, mission,
                                   on_progress=progress, get_steer=get_steer)

    return _start_run(user, "research", worker)


def _research_and_store(user_id: str, profile: dict, mission: str | None,
                        on_progress=None, get_steer=None) -> str:
    """Shared by the interactive endpoint and the campaign scheduler."""
    ideas = agent.run_research(user_id, profile, mission,
                               on_progress=on_progress, get_steer=get_steer)
    if not ideas:
        raise RuntimeError("the researcher came back empty — try again")
    rows = db.create_ideas(user_id, ideas)
    # Fresh trends supersede stale proposals from earlier runs.
    superseded = db.supersede_stale_ideas(user_id, rows[0]["run_id"])
    return (
        f"{len(rows)} ideas proposed"
        + (f" · {superseded} stale idea{'s' if superseded != 1 else ''} superseded" if superseded else "")
        + "."
    )


@app.post("/ideas/{idea_id}/accept")
def accept_idea(idea_id: str, user: dict = Depends(auth.current_user)):
    if llm is None:
        raise HTTPException(status_code=503, detail="AI 服务尚未配置")
    creator = _creator(user)
    _require_active(creator)
    idea = db.get_idea(user["id"], idea_id)
    if idea is None:
        raise HTTPException(status_code=404, detail="没有找到这个选题")
    db.update_idea(user["id"], idea_id, {"status": "accepted"})
    drafts = agent.draft_variants(
        user["id"], db.idea_out(idea), creator["ip_profile"],
        creator["editorial_rules"], creator["platforms"],
    )
    rows = db.create_drafts(user["id"], idea, drafts)
    return {"drafts": [db.draft_out(r) for r in rows]}


class DeclineRequest(BaseModel):
    reason: str


@app.post("/ideas/{idea_id}/decline")
def decline_idea(idea_id: str, req: DeclineRequest, user: dict = Depends(auth.current_user)):
    row = db.update_idea(user["id"], idea_id, {"status": "declined", "feedback": {"reason": req.reason.strip()[:300]}})
    if row is None:
        raise HTTPException(status_code=404, detail="没有找到这个选题")
    return db.idea_out(row)


class DraftEditRequest(BaseModel):
    text: str


def _recheck(user: dict, draft: dict, text: str, rules: dict) -> list[dict]:
    return editorial.check_draft(
        draft["platform"], text, draft["hashtags"], draft["sponsored"],
        rules, draft["atom_ids"], db.atom_titles(user["id"]), db.shipped_texts(user["id"]),
    )


@app.patch("/drafts/{draft_id}")
def edit_draft(draft_id: str, req: DraftEditRequest, user: dict = Depends(auth.current_user)):
    creator = _creator(user)
    draft = db.get_draft(user["id"], draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="没有找到这篇初稿")
    checks = _recheck(user, draft, req.text, creator["editorial_rules"])
    return db.draft_out(db.update_draft(user["id"], draft_id, {"body": req.text[:6000], "checks": checks}))


@app.post("/drafts/{draft_id}/approve")
def approve_draft(draft_id: str, req: DraftEditRequest, user: dict = Depends(auth.current_user)):
    """Approve re-runs the engine on the FINAL text — after any human edit.
    A failing check is a hard veto: 409, with the fresh rows attached."""
    creator = _creator(user)
    draft = db.get_draft(user["id"], draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="没有找到这篇初稿")
    checks = _recheck(user, draft, req.text, creator["editorial_rules"])
    if editorial.blocked(checks):
        db.update_draft(user["id"], draft_id, {"body": req.text[:6000], "checks": checks})
        raise HTTPException(status_code=409, detail={"message": "这篇初稿还有未通过的检查。", "checks": checks})
    db.bump_atom_use(user["id"], draft["atom_ids"])
    return db.draft_out(db.update_draft(
        user["id"], draft_id,
        {"body": req.text[:6000], "checks": checks, "status": "approved",
         "slot_date": date.today().isoformat()},
    ))


@app.post("/drafts/{draft_id}/decline")
def decline_draft(draft_id: str, req: DeclineRequest, user: dict = Depends(auth.current_user)):
    row = db.update_draft(user["id"], draft_id, {"status": "declined", "feedback": {"reason": req.reason.strip()[:300]}})
    if row is None:
        raise HTTPException(status_code=404, detail="没有找到这篇初稿")
    return db.draft_out(row)


@app.post("/drafts/{draft_id}/export")
def export_draft(draft_id: str, user: dict = Depends(auth.current_user)):
    draft = db.get_draft(user["id"], draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="没有找到这篇初稿")
    if draft["status"] != "approved":
        raise HTTPException(status_code=409, detail="只有通过审核的初稿可以导出")
    return db.draft_out(db.update_draft(user["id"], draft_id, {"status": "exported"}))


# ---------- Results (self-reported — the loop's measurement path) ----------

class ResultRequest(BaseModel):
    draftId: str | None = None
    title: str
    platform: str
    postedAt: str
    metrics: dict
    notes: str | None = None


@app.get("/results")
def results(user: dict = Depends(auth.current_user)):
    return {"results": [db.result_out(r) for r in db.list_results(user["id"])]}


@app.post("/results")
def log_result(req: ResultRequest, user: dict = Depends(auth.current_user)):
    _creator(user)
    metrics = {k: max(0, int(req.metrics.get(k, 0))) for k in ("views", "likes", "comments", "saves", "follows")}
    if req.draftId:
        db.update_draft(user["id"], req.draftId, {"status": "posted"})
    return db.result_out(db.create_result(user["id"], {
        "draftId": req.draftId, "title": req.title.strip()[:120],
        "platform": req.platform if req.platform in editorial.PLATFORM_LIMITS else "x",
        "postedAt": req.postedAt[:10], "metrics": metrics,
        "notes": (req.notes or "").strip()[:300] or None,
    }))


# ---------- Campaigns: standing missions + the always-on scheduler ----------

class CampaignRequest(BaseModel):
    title: str
    prompt: str
    cadence: str = "manual"
    hourLocal: int = 8


@app.get("/campaigns")
def campaigns(user: dict = Depends(auth.current_user)):
    _creator(user)
    return {"campaigns": [db.campaign_out(c) for c in db.list_campaigns(user["id"])]}


@app.post("/campaigns")
def create_campaign(req: CampaignRequest, user: dict = Depends(auth.current_user)):
    _creator(user)
    if not req.title.strip() or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="定时任务需要名称和具体要求")
    row = db.create_campaign(user["id"], {
        "title": req.title.strip()[:120],
        "prompt": req.prompt.strip()[:1000],
        "cadence": req.cadence if req.cadence in ("manual", "daily", "weekly") else "manual",
        "hourLocal": max(0, min(23, int(req.hourLocal))),
    })
    return db.campaign_out(row)


class CampaignPatch(BaseModel):
    title: str | None = None
    prompt: str | None = None
    cadence: str | None = None
    hourLocal: int | None = None
    enabled: bool | None = None


@app.patch("/campaigns/{campaign_id}")
def patch_campaign(campaign_id: str, req: CampaignPatch, user: dict = Depends(auth.current_user)):
    fields = {}
    if req.title is not None:
        fields["title"] = req.title.strip()[:120]
    if req.prompt is not None:
        fields["prompt"] = req.prompt.strip()[:1000]
    if req.cadence in ("manual", "daily", "weekly"):
        fields["cadence"] = req.cadence
    if req.hourLocal is not None:
        fields["hour_local"] = max(0, min(23, int(req.hourLocal)))
    if req.enabled is not None:
        fields["enabled"] = bool(req.enabled)
    if not fields:
        raise HTTPException(status_code=400, detail="没有需要更新的内容")
    row = db.update_campaign(user["id"], campaign_id, fields)
    if row is None:
        raise HTTPException(status_code=404, detail="没有找到这个定时任务")
    return db.campaign_out(row)


@app.delete("/campaigns/{campaign_id}")
def remove_campaign(campaign_id: str, user: dict = Depends(auth.current_user)):
    if not db.delete_campaign(user["id"], campaign_id):
        raise HTTPException(status_code=404, detail="没有找到这个定时任务；内置任务不能删除")
    return {"ok": True}


def _campaign_report(campaign: dict, creator: dict, on_progress=None) -> str:
    """One campaign firing. Built-in = the weekly growth review; everything
    else runs the campaign's mission through the researcher."""
    user_id = campaign["user_id"]
    if campaign["built_in"]:
        return _review_and_store(user_id, creator, on_progress=on_progress)
    profile = {**creator["ip_profile"], "niche": creator["niche"]}
    return _research_and_store(user_id, profile, campaign["prompt"], on_progress=on_progress)


@app.post("/campaigns/{campaign_id}/run")
def run_campaign_now(campaign_id: str, user: dict = Depends(auth.current_user)):
    if llm is None:
        raise HTTPException(status_code=503, detail="AI 服务尚未配置")
    creator = _creator(user)
    _require_active(creator)
    rows = [c for c in db.list_campaigns(user["id"]) if c["id"] == campaign_id]
    if not rows:
        raise HTTPException(status_code=404, detail="没有找到这个定时任务")
    campaign = rows[0]
    user_id = user["id"]

    def worker(progress, get_steer):
        progress(f"正在运行“{campaign['title']}”…")
        report = _campaign_report(campaign, creator, on_progress=progress)
        db.update_campaign(user_id, campaign_id,
                           {"last_run_at": db._now(), "last_report": report[:500]})
        return report

    return _start_run(user, "campaign", worker)


# The scheduler: one 60-second loop per worker process; the CAS claim in
# db.claim_campaign means exactly one worker fires each due campaign.
_CADENCE_STALENESS = {"daily": timedelta(hours=20), "weekly": timedelta(days=6)}


def _scheduler_tick():
    now = datetime.now(timezone.utc)
    for c in db.scheduled_campaigns():
        staleness = _CADENCE_STALENESS.get(c["cadence"])
        if staleness is None or now.hour < c["hour_local"]:
            continue
        threshold = now - staleness
        last = c.get("last_run_at")
        if last and datetime.fromisoformat(last) >= threshold:
            continue
        if not db.claim_campaign(c["id"], threshold.isoformat()):
            continue  # another worker owns this firing
        creator = db.get_creator(c["user_id"])
        if creator is None or not creator["activated"] or creator["paused"]:
            db.update_campaign(c["user_id"], c["id"],
                               {"last_report": "Skipped — creator paused or not activated."})
            continue
        try:
            report = _campaign_report(c, creator)
            db.update_campaign(c["user_id"], c["id"], {"last_report": report[:500]})
        except Exception as e:
            db.update_campaign(c["user_id"], c["id"], {"last_report": f"Failed: {e}"[:300]})


def _scheduler_loop():
    while True:
        time.sleep(60)  # sleep first: let the module finish importing
        try:
            _scheduler_tick()
        except Exception:
            pass  # a bad tick must never kill the loop


if os.getenv("DISABLE_SCHEDULER") != "1" and DEEPSEEK_KEY:
    threading.Thread(target=_scheduler_loop, daemon=True).start()


# ---------- Growth reviews: strategy moves the creator blesses ----------

@app.get("/reviews")
def reviews(user: dict = Depends(auth.current_user)):
    _creator(user)
    return {"reviews": [db.review_out(r) for r in db.list_reviews(user["id"])]}


@app.post("/reviews/run")
def run_review(user: dict = Depends(auth.current_user)):
    if llm is None:
        raise HTTPException(status_code=503, detail="AI 服务尚未配置")
    creator = _creator(user)
    _require_active(creator)
    user_id = user["id"]

    def worker(progress, get_steer):
        return _review_and_store(user_id, creator, on_progress=progress)

    return _start_run(user, "review", worker)


def _review_and_store(user_id: str, creator: dict, on_progress=None) -> str:
    """Shared by the interactive endpoint and the campaign scheduler."""
    def progress(msg):
        if on_progress:
            on_progress(msg)

    progress("正在查看内容目标、创作记录和发布结果…")
    ideas = [db.idea_out(i) for i in db.list_ideas(user_id)]
    drafts = [db.draft_out(d) for d in db.list_drafts(user_id)]
    results = [db.result_out(r) for r in db.list_results(user_id)]

    def count_by(rows, key):
        out: dict[str, int] = {}
        for r in rows:
            out[r.get(key) or "—"] = out.get(r.get(key) or "—", 0) + 1
        return out

    stats = {
        "ideasByPillar": count_by(ideas, "pillar"),
        "ideasByStatus": count_by(ideas, "status"),
        "draftsByStatus": count_by(drafts, "status"),
        "draftsByPlatform": count_by(drafts, "platform"),
        "results": [
            {"title": r["title"], "platform": r["platform"], "postedAt": r["postedAt"],
             "metrics": r["metrics"], "notes": r.get("notes")}
            for r in results[:20]
        ],
        "declineLessons": db.decline_lessons(user_id),
    }
    progress("正在整理内容回顾…")
    review = agent.growth_review(user_id, creator["ip_profile"], stats)
    if review is None:
        raise RuntimeError("the review came back empty — try again")
    db.create_review(user_id, review["summary"], review["moves"])
    return review["summary"][:300]


class MoveDecision(BaseModel):
    accept: bool


@app.post("/reviews/{review_id}/moves/{index}")
def decide_move(review_id: str, index: int, req: MoveDecision, user: dict = Depends(auth.current_user)):
    creator = _creator(user)
    review = db.get_review(user["id"], review_id)
    if review is None or index < 0 or index >= len(review["moves"]):
        raise HTTPException(status_code=404, detail="没有找到这条建议")
    moves = review["moves"]
    if moves[index]["status"] != "proposed":
        raise HTTPException(status_code=409, detail="这条建议已经处理过")
    moves[index]["status"] = "accepted" if req.accept else "declined"
    row = db.update_review(user["id"], review_id, {"moves": moves})
    if req.accept and moves[index].get("lesson"):
        # An accepted move amends the brand book: the lesson becomes a
        # standing instruction, and that's a new profile version.
        profile = dict(creator["ip_profile"])
        lessons = [x for x in profile.get("lessons", []) if x != moves[index]["lesson"]]
        profile["lessons"] = (lessons + [moves[index]["lesson"]])[-10:]
        db.snapshot_version(user["id"], creator["ip_version"], creator["ip_profile"])
        db.update_creator(user["id"], {
            "ip_profile": profile,
            "ip_version": creator["ip_version"] + 1,
        })
    return db.review_out(row)


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
  goals (0-3 of {statement, horizon} — only goals they actually stated),
  niche ({topics (2-3 search topics for their niche), subreddits (1-3
    subreddit names, no r/ prefix), queries (1-2 news search phrases)}).
- Everything must trace to what they wrote. When unsure, leave it out —
  an empty field beats an invented one.
- Sharpen their language; do not replace it with generic marketing speak.
- Write every user-facing string value in natural Simplified Chinese; keep JSON keys unchanged.
"""


@app.post("/interpret-profile")
def interpret_profile(req: InterpretRequest, user: dict | None = Depends(auth.optional_user)):
    if llm is None:
        raise HTTPException(status_code=503, detail="AI 服务尚未配置")
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
        raise HTTPException(status_code=502, detail="内容档案整理失败，请重试")
    profile = _validate_profile(data)
    niche = profile.pop("_niche")
    if user is None:
        return {"profile": profile}
    # Signed in: the interpretation IS the new brand book version — saved,
    # but not active until the user blesses it. The old book goes to history.
    creator = _creator(user)
    if creator["ip_profile"].get("positioning"):
        db.snapshot_version(user["id"], creator["ip_version"], creator["ip_profile"])
    # Lessons survive re-interpretation: they were blessed separately.
    profile["lessons"] = creator["ip_profile"].get("lessons", [])
    row = db.update_creator(user["id"], {
        "ip_profile": profile,
        "ip_version": creator["ip_version"] + 1,
        "niche": niche if any(niche.values()) else creator["niche"],
        "activated": False,
    })
    return {"profile": {**profile, "version": row["ip_version"], "updatedAt": row["updated_at"][:10]}}


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
    niche = data.get("niche") or {}
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
        "_niche": {
            "topics": _strlist(niche.get("topics"), 3, 60),
            "subreddits": [s.removeprefix("r/") for s in _strlist(niche.get("subreddits"), 3, 40)],
            "queries": _strlist(niche.get("queries"), 2, 60),
        },
    }


# ---------- LLM: the Growth Lead chat (persistent threads when signed in) ----------

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    profile: dict | None = None
    threadId: str | None = None


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
- Never invent metrics, trend data, or platform statistics.
- Drafts are suggestions — the creator reviews, edits, and posts everything
  themselves. Keep answers concise and practical; no hype words.
- Always reply in natural Simplified Chinese, including drafts, questions,
  explanations, and summaries. Keep proper names and platform names as written.
"""

# Appended AFTER the profile context — the last instruction is the one
# models obey most reliably. test_prompts.py asserts this stays true.
FINAL_CHECK = (
    "\n\nFINAL CHECK before every reply: if it would contain any client, "
    "person, event, anecdote, or number from the creator's life that is "
    "not in the profile above or this conversation, do not write the "
    "draft — not even with placeholders. Reply instead with the 2-3 "
    "questions that would get you the real story."
)


@app.get("/threads")
def threads(user: dict = Depends(auth.current_user)):
    return {"threads": db.list_threads(user["id"])}


@app.get("/threads/{thread_id}/messages")
def thread_messages(thread_id: str, user: dict = Depends(auth.current_user)):
    return {"messages": db.list_messages(user["id"], thread_id)}


@app.post("/chat")
def chat(req: ChatRequest, user: dict | None = Depends(auth.optional_user)):
    if llm is None:
        raise HTTPException(status_code=503, detail="AI 服务尚未配置")
    profile = req.profile
    if user is not None:
        profile = _creator(user)["ip_profile"]
    context = ""
    if profile:
        context = "\n\nCreator IP profile (their blessed brand book):\n" + json.dumps(profile)[:4000]
    messages = [{"role": "system", "content": CHAT_SYSTEM + context + FINAL_CHECK}]
    for m in req.history[-12:]:
        if m.role in ("user", "assistant") and m.content.strip():
            messages.append({"role": m.role, "content": m.content.strip()[:2000]})
    messages.append({"role": "user", "content": req.message.strip()[:2000]})
    resp = llm.chat.completions.create(
        model=MODEL, messages=messages, temperature=0.6, max_tokens=700
    )
    reply = resp.choices[0].message.content

    thread_id = req.threadId
    if user is not None:
        if thread_id is None:
            thread_id = db.create_thread(user["id"], req.message.strip()[:60] or "新对话")["id"]
        db.add_message(user["id"], thread_id, "user", req.message.strip())
        db.add_message(user["id"], thread_id, "assistant", reply)
        db.touch_thread(user["id"], thread_id)
    return {"reply": reply, "threadId": thread_id}
