"""Resolve the caller's Supabase session token to a user.

The frontend sends `Authorization: Bearer <access_token>` (from the user's
session). We ask Supabase Auth who the token belongs to; every data
endpoint then operates only on that user's rows. Same pattern as the first
two samples — this file is deliberately identical in shape.
"""

import os
import time
from datetime import datetime, timezone
from typing import Any

import requests as http
from fastapi import Header, HTTPException

URL = os.environ["SUPABASE_URL"].rstrip("/")
PUBLISHABLE = os.environ["SUPABASE_PUBLISHABLE_KEY"]

# Tiny cache so a burst of requests doesn't hammer the auth endpoint.
_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_TTL = 60.0


def _resolve(token: str) -> dict[str, Any] | None:
    hit = _cache.get(token)
    if hit and time.time() - hit[0] < _TTL:
        return hit[1]
    r = http.get(
        f"{URL}/auth/v1/user",
        headers={"apikey": PUBLISHABLE, "Authorization": f"Bearer {token}"},
        timeout=10,
    )
    if r.status_code != 200:
        return None
    body = r.json()
    metadata = body.get("user_metadata") or {}
    if metadata.get("demo_kind") == "lantr-private-demo":
        try:
            expires = datetime.fromisoformat(
                str(metadata.get("demo_expires_at", "")).replace("Z", "+00:00")
            )
            if expires <= datetime.now(timezone.utc):
                return None
        except ValueError:
            return None
    user = {"id": body["id"], "email": body.get("email", ""), "metadata": metadata}
    _cache[token] = (time.time(), user)
    if len(_cache) > 500:
        _cache.clear()
    return user


def current_user(authorization: str = Header(default="")) -> dict[str, Any]:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="请先登录")
    user = _resolve(authorization.removeprefix("Bearer ").strip())
    if user is None:
        raise HTTPException(status_code=401, detail="登录状态无效或已过期，请重新登录")
    return user


def optional_user(authorization: str = Header(default="")) -> dict[str, Any] | None:
    """For endpoints that work signed-out (chat) but do more signed-in."""
    if not authorization.startswith("Bearer "):
        return None
    return _resolve(authorization.removeprefix("Bearer ").strip())
