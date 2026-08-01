"""Milestone-4 persistence: one JSON file, one demo workspace. Supabase and
per-user rows replace this at Milestone 5 — the endpoint shapes won't change.
"""

from __future__ import annotations

import json
import os
import threading
import uuid
from datetime import date

PATH = os.path.join(os.path.dirname(__file__), "workspace.json")
_lock = threading.Lock()

_EMPTY = {"materials": [], "atoms": [], "ideas": [], "drafts": []}


def _load() -> dict:
    try:
        with open(PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return json.loads(json.dumps(_EMPTY))


def _save(data: dict) -> None:
    tmp = PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=1)
    os.replace(tmp, PATH)


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def today() -> str:
    return date.today().isoformat()


def workspace() -> dict:
    with _lock:
        return _load()


def add(kind: str, row: dict) -> dict:
    with _lock:
        data = _load()
        data[kind].append(row)
        _save(data)
        return row


def add_many(kind: str, rows: list[dict]) -> list[dict]:
    with _lock:
        data = _load()
        data[kind].extend(rows)
        _save(data)
        return rows


def update(kind: str, row_id: str, fields: dict) -> dict | None:
    with _lock:
        data = _load()
        for row in data[kind]:
            if row["id"] == row_id:
                row.update(fields)
                _save(data)
                return row
        return None


def get(kind: str, row_id: str) -> dict | None:
    with _lock:
        for row in _load()[kind]:
            if row["id"] == row_id:
                return row
        return None


def atom_titles() -> dict[str, str]:
    """id -> material title, for citation checks."""
    with _lock:
        return {a["id"]: a["materialTitle"] for a in _load()["atoms"]}


def shipped_texts() -> list[str]:
    """Everything already approved or beyond — the duplicate-check corpus."""
    with _lock:
        return [
            d["text"]
            for d in _load()["drafts"]
            if d["status"] in ("approved", "exported", "posted")
        ]


def decline_lessons(limit: int = 5) -> list[str]:
    """The last N decline reasons — injected into generation as standing
    lessons, so the agent stops proposing what the creator keeps refusing."""
    with _lock:
        data = _load()
        reasons = [
            r["feedback"]["reason"]
            for r in data["ideas"] + data["drafts"]
            if r.get("feedback", {}).get("reason")
        ]
        return reasons[-limit:]
