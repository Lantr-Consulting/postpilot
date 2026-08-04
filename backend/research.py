"""Niche-signal fetchers — the radar's eyes. All keyless except YouTube
(one free API key, skipped gracefully when absent). Google Trends is the
taught "unofficial API that will break someday": nullable end-to-end.

Every fetcher returns [] on failure — tool errors are data, not crashes.
"""

from __future__ import annotations

import os
import time
import xml.etree.ElementTree as ET
from urllib.parse import quote_plus

import requests

UA = {"User-Agent": "PostPilot/0.1 (past Lantr student project; contact: hello@lantr.ai)"}
TIMEOUT = 8

# One shared TTL cache so a classroom of refreshes doesn't hammer free APIs.
_cache: dict[str, tuple[float, list]] = {}
CACHE_TTL = 600  # seconds


def _cached(key: str, fn):
    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < CACHE_TTL:
        return hit[1]
    try:
        value = fn()
    except Exception:
        value = []
    _cache[key] = (now, value)
    return value


def _fmt_count(n: int) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}k"
    return str(n)


# ---------- Reddit (keyless via RSS — the JSON API now 403s without OAuth,
# which is itself the lesson: free API surfaces shrink over time) ----------

def reddit_hot(subreddit: str, limit: int = 5) -> list[dict]:
    def fetch():
        r = requests.get(
            f"https://www.reddit.com/r/{quote_plus(subreddit)}/hot.rss",
            headers=UA,
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        root = ET.fromstring(r.content)
        ns = {"a": "http://www.w3.org/2005/Atom"}
        items = []
        for entry in root.findall("a:entry", ns):
            title = entry.findtext("a:title", default="", namespaces=ns)
            link_el = entry.find("a:link", ns)
            link = link_el.get("href") if link_el is not None else None
            if not title:
                continue
            items.append(
                {
                    "source": "reddit",
                    "title": f"r/{subreddit}: “{title[:140]}”",
                    "datum": "hot on the subreddit now",
                    "url": link,
                }
            )
            if len(items) >= limit:
                break
        return items

    return _cached(f"reddit:{subreddit}", fetch)


# ---------- Bluesky (public AppView, fully keyless) ----------

def bsky_search(query: str, limit: int = 5) -> list[dict]:
    def fetch():
        # api.bsky.app, not public.api.bsky.app — the "public" hostname sits
        # behind a stricter CDN that 403s server-side clients.
        r = requests.get(
            "https://api.bsky.app/xrpc/app.bsky.feed.searchPosts",
            params={"q": query, "limit": limit, "sort": "top"},
            headers=UA,
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        items = []
        for post in r.json().get("posts", []):
            text = (post.get("record", {}).get("text") or "").replace("\n", " ")
            if not text:
                continue
            likes = post.get("likeCount", 0)
            handle = post.get("author", {}).get("handle", "someone")
            items.append(
                {
                    "source": "bluesky",
                    "title": f"@{handle}: “{text[:140]}”",
                    "datum": f"{_fmt_count(likes)} likes · top for “{query}”",
                    "url": None,
                }
            )
        return items

    return _cached(f"bsky:{query}", fetch)


# ---------- Google News RSS (keyless) ----------

def news_headlines(query: str, limit: int = 5) -> list[dict]:
    def fetch():
        r = requests.get(
            f"https://news.google.com/rss/search?q={quote_plus(query)}&hl=en-US&gl=US&ceid=US:en",
            headers=UA,
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        root = ET.fromstring(r.content)
        items = []
        for item in root.iter("item"):
            title = item.findtext("title") or ""
            link = item.findtext("link") or None
            source = item.find("{https://news.google.com/rss}source")
            source_name = source.text if source is not None else "News"
            if not title:
                continue
            items.append(
                {
                    "source": "news",
                    "title": title[:160],
                    "datum": f"{source_name} · “{query}”",
                    "url": link,
                }
            )
            if len(items) >= limit:
                break
        return items

    return _cached(f"news:{query}", fetch)


# ---------- Google Trends (UNOFFICIAL — will break someday, and that's the
# lesson: nullable end-to-end, the UI says so, the agent never invents it) ----

def google_trends(limit: int = 5) -> list[dict]:
    # History proves the lesson: the old dailytrends JSON API died mid-build
    # (404 now). This RSS replacement is just as unofficial and will break
    # someday too — which is why the radar treats this source as optional.
    def fetch():
        r = requests.get(
            "https://trends.google.com/trending/rss",
            params={"geo": "US"},
            headers=UA,
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        root = ET.fromstring(r.content)
        ht = "{https://trends.google.com/trending/rss}"
        items = []
        for item in root.iter("item"):
            q = item.findtext("title") or ""
            traffic = item.findtext(f"{ht}approx_traffic") or ""
            if not q:
                continue
            items.append(
                {
                    "source": "trends",
                    "title": f"“{q}” trending on Google",
                    "datum": (f"{traffic} searches · " if traffic else "") + "today",
                    "url": None,
                }
            )
            if len(items) >= limit:
                break
        return items

    return _cached("gtrends", fetch)


# ---------- YouTube Data API (the one free key; skipped without it) ----------

YOUTUBE_KEY = os.getenv("YOUTUBE_API_KEY", "")


def youtube_search(query: str, limit: int = 4) -> list[dict]:
    if not YOUTUBE_KEY:
        return []

    def fetch():
        r = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "key": YOUTUBE_KEY,
                "q": query,
                "part": "snippet",
                "type": "video",
                "order": "viewCount",
                "publishedAfter": time.strftime(
                    "%Y-%m-%dT00:00:00Z", time.gmtime(time.time() - 7 * 86400)
                ),
                "maxResults": limit,
            },
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        hits = r.json().get("items", [])
        ids = [h["id"]["videoId"] for h in hits if h.get("id", {}).get("videoId")]
        stats: dict[str, str] = {}
        if ids:
            s = requests.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={"key": YOUTUBE_KEY, "id": ",".join(ids), "part": "statistics"},
                timeout=TIMEOUT,
            )
            if s.ok:
                for v in s.json().get("items", []):
                    stats[v["id"]] = _fmt_count(int(v["statistics"].get("viewCount", 0)))
        items = []
        for h in hits:
            vid = h.get("id", {}).get("videoId")
            sn = h.get("snippet", {})
            if not vid:
                continue
            views = stats.get(vid)
            items.append(
                {
                    "source": "youtube",
                    "title": f"“{sn.get('title', '')[:120]}” — {sn.get('channelTitle', '')}",
                    "datum": (f"{views} views · " if views else "") + "this week",
                    "url": f"https://www.youtube.com/watch?v={vid}",
                }
            )
        return items

    return _cached(f"yt:{query}", fetch)


# ---------- The radar: interleave a few of everything ----------

def radar(topics: list[str], subreddits: list[str], queries: list[str]) -> list[dict]:
    """Aggregate every source for the niche; each source degrades to [].
    Returns TrendItem-shaped dicts the frontend renders directly."""
    buckets: list[list[dict]] = []
    for t in topics[:2]:
        buckets.append(youtube_search(t))
        buckets.append(bsky_search(t, limit=3))
    for s in subreddits[:2]:
        buckets.append(reddit_hot(s, limit=3))
    for q in queries[:1]:
        buckets.append(news_headlines(q, limit=3))
    buckets.append(google_trends(limit=3))

    # Round-robin interleave so no single source dominates the rail.
    items: list[dict] = []
    i = 0
    while len(items) < 12 and any(len(b) > i for b in buckets):
        for b in buckets:
            if len(b) > i and len(items) < 12:
                items.append(b[i])
        i += 1
    for n, item in enumerate(items):
        item["id"] = f"tr-{n}"
    return items
