"""Supabase data access (PostgREST) — per-user creators, library, pipeline.

The backend uses the secret (service) key, which bypasses Row-Level
Security; authorization happens in auth.py by resolving the caller's JWT to
a user id, and every query here filters on that user id. Users' direct
reads are protected by the RLS policies in schema.sql.

Rows are snake_case in Postgres and camelCase over the API; the _out()
helpers do the renaming so lib/types.ts never changes shape. Post text
lives in a `body` column; it comes out as `text`.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import requests as http

URL = os.environ["SUPABASE_URL"].rstrip("/")
SECRET = os.environ["SUPABASE_SECRET_KEY"]


def _headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    return {
        "apikey": SECRET,
        "Authorization": f"Bearer {SECRET}",
        "Content-Type": "application/json",
        **(extra or {}),
    }


def _rest(method: str, path: str, *, params: dict | None = None, json: Any = None,
          extra_headers: dict | None = None) -> Any:
    r = http.request(
        method,
        f"{URL}/rest/v1/{path}",
        headers=_headers(extra_headers),
        params=params,
        json=json,
        timeout=20,
    )
    r.raise_for_status()
    return r.json() if r.text else None


_REPR = {"Prefer": "return=representation"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Creators (one row per user)
# ---------------------------------------------------------------------------

def creator_out(row: dict) -> dict:
    return {
        "ipProfile": {**row["ip_profile"], "version": row["ip_version"],
                      "updatedAt": row["updated_at"][:10]},
        "editorialRules": row["editorial_rules"],
        "platforms": row["platforms"],
        "niche": row["niche"],
        "activated": row["activated"],
        "paused": row["paused"],
    }


def get_creator(user_id: str) -> dict | None:
    rows = _rest("GET", "pp_creators", params={"user_id": f"eq.{user_id}", "limit": 1})
    return rows[0] if rows else None


def ensure_creator(user_id: str, email: str, defaults: dict) -> dict:
    creator = get_creator(user_id)
    if creator:
        return creator
    # New creators start inactive: tell your story -> review the brand book
    # -> explicit Activate. Nothing generates until the user blesses it.
    row = {
        "user_id": user_id,
        "email": email,
        "ip_profile": defaults["ipProfile"],
        "editorial_rules": defaults["editorialRules"],
        "platforms": defaults["platforms"],
        "niche": defaults["niche"],
        "activated": False,
    }
    return _rest("POST", "pp_creators", json=row, extra_headers=_REPR)[0]


def update_creator(user_id: str, fields: dict) -> dict:
    fields = {**fields, "updated_at": _now()}
    return _rest("PATCH", "pp_creators", params={"user_id": f"eq.{user_id}"},
                 json=fields, extra_headers=_REPR)[0]


# ---------------------------------------------------------------------------
# Profile versions — every interpretation or amendment snapshots the old book
# ---------------------------------------------------------------------------

def snapshot_version(user_id: str, version: int, profile: dict) -> None:
    _rest("POST", "pp_profile_versions",
          json={"user_id": user_id, "version": version, "profile": profile})


def list_versions(user_id: str) -> list[dict]:
    rows = _rest("GET", "pp_profile_versions",
                 params={"user_id": f"eq.{user_id}", "order": "version.desc", "limit": 20})
    return [{"version": r["version"], "profile": r["profile"],
             "createdAt": r["created_at"][:10]} for r in rows]


def get_version(user_id: str, version: int) -> dict | None:
    rows = _rest("GET", "pp_profile_versions",
                 params={"user_id": f"eq.{user_id}", "version": f"eq.{version}", "limit": 1})
    return rows[0] if rows else None


# ---------------------------------------------------------------------------
# Growth reviews
# ---------------------------------------------------------------------------

def review_out(row: dict) -> dict:
    return {"id": row["id"], "at": row["created_at"][:10],
            "summary": row["summary"], "moves": row["moves"]}


def create_review(user_id: str, summary: str, moves: list[dict]) -> dict:
    return _rest("POST", "pp_reviews",
                 json={"user_id": user_id, "summary": summary, "moves": moves},
                 extra_headers=_REPR)[0]


def list_reviews(user_id: str, limit: int = 5) -> list[dict]:
    return _rest("GET", "pp_reviews",
                 params={"user_id": f"eq.{user_id}", "order": "created_at.desc",
                         "limit": limit})


def get_review(user_id: str, review_id: str) -> dict | None:
    rows = _rest("GET", "pp_reviews",
                 params={"user_id": f"eq.{user_id}", "id": f"eq.{review_id}", "limit": 1})
    return rows[0] if rows else None


def update_review(user_id: str, review_id: str, fields: dict) -> dict | None:
    rows = _rest("PATCH", "pp_reviews",
                 params={"user_id": f"eq.{user_id}", "id": f"eq.{review_id}"},
                 json=fields, extra_headers=_REPR)
    return rows[0] if rows else None


# ---------------------------------------------------------------------------
# Library
# ---------------------------------------------------------------------------

def material_out(row: dict) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "kind": row["kind"],
        "addedAt": row["added_at"],
        "words": row["words"],
        "status": row["status"],
        "atomCount": row["atom_count"],
        "excerpt": row["excerpt"],
    }


def list_materials(user_id: str) -> list[dict]:
    return _rest("GET", "pp_materials",
                 params={"user_id": f"eq.{user_id}", "order": "created_at.desc",
                         "select": "id,title,kind,added_at,words,status,atom_count,excerpt"})


def get_material(user_id: str, material_id: str) -> dict | None:
    rows = _rest("GET", "pp_materials",
                 params={"user_id": f"eq.{user_id}", "id": f"eq.{material_id}", "limit": 1})
    return rows[0] if rows else None


def create_material(user_id: str, m: dict) -> dict:
    return _rest("POST", "pp_materials", json={
        "user_id": user_id, "title": m["title"], "kind": m["kind"],
        "words": m["words"], "excerpt": m["excerpt"], "body": m["body"],
    }, extra_headers=_REPR)[0]


def update_material(user_id: str, material_id: str, fields: dict) -> dict:
    return _rest("PATCH", "pp_materials",
                 params={"user_id": f"eq.{user_id}", "id": f"eq.{material_id}"},
                 json=fields, extra_headers=_REPR)[0]


def atom_out(row: dict) -> dict:
    return {
        "id": row["id"],
        "materialId": row["material_id"],
        "materialTitle": row["material_title"],
        "kind": row["kind"],
        "text": row["body"],
        "pillars": row["pillars"],
        "narrative": row.get("narrative"),
        "usedCount": row["used_count"],
    }


def list_atoms(user_id: str) -> list[dict]:
    return _rest("GET", "pp_atoms",
                 params={"user_id": f"eq.{user_id}", "order": "created_at.desc"})


def create_atoms(user_id: str, material: dict, atoms: list[dict]) -> list[dict]:
    if not atoms:
        return []
    return _rest("POST", "pp_atoms", json=[
        {
            "user_id": user_id, "material_id": material["id"],
            "material_title": material["title"], "kind": a["kind"],
            "body": a["text"], "pillars": a["pillars"],
            "narrative": a.get("narrative"),
        }
        for a in atoms
    ], extra_headers=_REPR)


def atom_titles(user_id: str) -> dict[str, str]:
    return {a["id"]: a["material_title"]
            for a in _rest("GET", "pp_atoms",
                           params={"user_id": f"eq.{user_id}", "select": "id,material_title"})}


def bump_atom_use(user_id: str, atom_ids: list[str]) -> None:
    for atom_id in atom_ids:
        rows = _rest("GET", "pp_atoms",
                     params={"user_id": f"eq.{user_id}", "id": f"eq.{atom_id}",
                             "select": "used_count", "limit": 1})
        if rows:
            _rest("PATCH", "pp_atoms",
                  params={"user_id": f"eq.{user_id}", "id": f"eq.{atom_id}"},
                  json={"used_count": rows[0]["used_count"] + 1})


# ---------------------------------------------------------------------------
# Pipeline: ideas & drafts
# ---------------------------------------------------------------------------

def idea_out(row: dict) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "angle": row["angle"],
        "pillar": row["pillar"],
        "rationale": row["rationale"],
        "evidence": row["evidence"],
        "status": row["status"],
        "narrative": row.get("narrative"),
        "declineReason": (row.get("feedback") or {}).get("reason"),
        "runId": row["run_id"],
    }


def list_ideas(user_id: str) -> list[dict]:
    return _rest("GET", "pp_ideas",
                 params={"user_id": f"eq.{user_id}", "order": "created_at.desc"})


def get_idea(user_id: str, idea_id: str) -> dict | None:
    rows = _rest("GET", "pp_ideas",
                 params={"user_id": f"eq.{user_id}", "id": f"eq.{idea_id}", "limit": 1})
    return rows[0] if rows else None


def create_ideas(user_id: str, ideas: list[dict]) -> list[dict]:
    if not ideas:
        return []
    return _rest("POST", "pp_ideas", json=[
        {
            "user_id": user_id, "title": i["title"], "angle": i["angle"],
            "pillar": i["pillar"], "rationale": i["rationale"],
            "evidence": i["evidence"], "run_id": i["runId"],
            "narrative": i.get("narrative"),
        }
        for i in ideas
    ], extra_headers=_REPR)


def update_idea(user_id: str, idea_id: str, fields: dict) -> dict | None:
    rows = _rest("PATCH", "pp_ideas",
                 params={"user_id": f"eq.{user_id}", "id": f"eq.{idea_id}"},
                 json=fields, extra_headers=_REPR)
    return rows[0] if rows else None


def draft_out(row: dict) -> dict:
    return {
        "id": row["id"],
        "ideaId": row["idea_id"],
        "ideaTitle": row["idea_title"],
        "platform": row["platform"],
        "text": row["body"],
        "hashtags": row["hashtags"],
        "sponsored": row["sponsored"],
        "atomIds": row["atom_ids"],
        "checks": row["checks"],
        "status": row["status"],
        "slotDate": row.get("slot_date"),
        "declineReason": (row.get("feedback") or {}).get("reason"),
    }


def list_drafts(user_id: str) -> list[dict]:
    return _rest("GET", "pp_drafts",
                 params={"user_id": f"eq.{user_id}", "order": "created_at.desc"})


def get_draft(user_id: str, draft_id: str) -> dict | None:
    rows = _rest("GET", "pp_drafts",
                 params={"user_id": f"eq.{user_id}", "id": f"eq.{draft_id}", "limit": 1})
    return rows[0] if rows else None


def create_drafts(user_id: str, idea: dict, drafts: list[dict]) -> list[dict]:
    if not drafts:
        return []
    return _rest("POST", "pp_drafts", json=[
        {
            "user_id": user_id, "idea_id": idea["id"], "idea_title": idea["title"],
            "platform": d["platform"], "body": d["text"], "hashtags": d["hashtags"],
            "sponsored": d["sponsored"], "atom_ids": d["atomIds"],
            "checks": d["checks"], "status": "draft",
        }
        for d in drafts
    ], extra_headers=_REPR)


def update_draft(user_id: str, draft_id: str, fields: dict) -> dict | None:
    rows = _rest("PATCH", "pp_drafts",
                 params={"user_id": f"eq.{user_id}", "id": f"eq.{draft_id}"},
                 json=fields, extra_headers=_REPR)
    return rows[0] if rows else None


def shipped_texts(user_id: str) -> list[str]:
    rows = _rest("GET", "pp_drafts",
                 params={"user_id": f"eq.{user_id}",
                         "status": "in.(approved,exported,posted)", "select": "body"})
    return [r["body"] for r in rows]


def decline_lessons(user_id: str, limit: int = 5) -> list[str]:
    lessons = []
    for table in ("pp_ideas", "pp_drafts"):
        rows = _rest("GET", table,
                     params={"user_id": f"eq.{user_id}", "feedback": "not.is.null",
                             "order": "created_at.desc", "select": "feedback", "limit": limit})
        lessons += [(r.get("feedback") or {}).get("reason", "") for r in rows]
    return [r for r in lessons if r][:limit]


# ---------------------------------------------------------------------------
# Results (self-reported)
# ---------------------------------------------------------------------------

def result_out(row: dict) -> dict:
    return {
        "id": row["id"], "draftId": row["draft_id"], "title": row["title"],
        "platform": row["platform"], "postedAt": row["posted_at"],
        "metrics": row["metrics"], "notes": row.get("notes"),
    }


def list_results(user_id: str) -> list[dict]:
    return _rest("GET", "pp_results",
                 params={"user_id": f"eq.{user_id}", "order": "posted_at.desc"})


def create_result(user_id: str, r: dict) -> dict:
    return _rest("POST", "pp_results", json={
        "user_id": user_id, "draft_id": r.get("draftId"), "title": r["title"],
        "platform": r["platform"], "posted_at": r["postedAt"],
        "metrics": r["metrics"], "notes": r.get("notes"),
    }, extra_headers=_REPR)[0]


# ---------------------------------------------------------------------------
# Threads & messages (Growth Lead chat)
# ---------------------------------------------------------------------------

def list_threads(user_id: str) -> list[dict]:
    rows = _rest("GET", "pp_threads",
                 params={"user_id": f"eq.{user_id}", "order": "updated_at.desc"})
    return [{"id": r["id"], "title": r["title"], "updatedAt": r["updated_at"]} for r in rows]


def create_thread(user_id: str, title: str) -> dict:
    r = _rest("POST", "pp_threads",
              json={"user_id": user_id, "title": title[:80]}, extra_headers=_REPR)[0]
    return {"id": r["id"], "title": r["title"], "updatedAt": r["updated_at"]}


def touch_thread(user_id: str, thread_id: str) -> None:
    _rest("PATCH", "pp_threads",
          params={"user_id": f"eq.{user_id}", "id": f"eq.{thread_id}"},
          json={"updated_at": _now()})


def list_messages(user_id: str, thread_id: str) -> list[dict]:
    rows = _rest("GET", "pp_messages",
                 params={"user_id": f"eq.{user_id}", "thread_id": f"eq.{thread_id}",
                         "order": "created_at.asc"})
    return [{"id": r["id"], "role": r["role"], "text": r["content"],
             "at": r["created_at"]} for r in rows]


def add_message(user_id: str, thread_id: str, role: str, content: str) -> None:
    _rest("POST", "pp_messages", json={
        "user_id": user_id, "thread_id": thread_id, "role": role,
        "content": content[:8000],
    })
