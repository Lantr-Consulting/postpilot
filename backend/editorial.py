"""The editorial engine — pure code, cited rules. The LLM drafts;
this module decides what ships. Every check carries its source: platform
documentation, the FTC's endorsement guides, or the creator's own blessed
rules. No LLM calls in this file, ever.
"""

from __future__ import annotations

import difflib
import re

# Character limits from the platforms' own documentation.
PLATFORM_LIMITS: dict[str, tuple[int, str]] = {
    "x": (280, "X docs: 280 chars"),
    "bluesky": (300, "Bluesky docs: 300 chars"),
    "instagram": (2200, "Instagram docs: 2,200 chars"),
    "linkedin": (3000, "LinkedIn docs: 3,000 chars"),
    "youtube": (5000, "YouTube docs: 5,000-char description"),
}

FTC_SOURCE = "16 CFR 255 (FTC Endorsement Guides)"
USER_RULES = "Your editorial rules"
GROUNDING = "PostPilot grounding rule"

# Anything in these unicode blocks counts as an emoji for the cap.
_EMOJI_RE = re.compile(
    "[\U0001f300-\U0001faff\U00002600-\U000027bf\U0001f000-\U0001f0ff\U0001f900-\U0001f9ff⬀-⯿]"
)

DUPLICATE_THRESHOLD = 0.85


def check_draft(
    platform: str,
    text: str,
    hashtags: list[str],
    sponsored: bool,
    rules: dict,
    atom_ids: list[str],
    known_atoms: dict[str, str],
    past_texts: list[str],
) -> list[dict]:
    """Run every rule; return the annotated check rows the UI renders.
    A draft ships only if every row passes — the server enforces that at
    approve time, after any human edit."""
    checks: list[dict] = []
    full = text + (" " + " ".join(hashtags) if hashtags else "")

    # 1. Platform length (per the platform's own docs)
    limit, source = PLATFORM_LIMITS.get(platform, PLATFORM_LIMITS["x"])
    n = len(full)
    checks.append(
        {
            "rule": "platform_length",
            "detail": f"{n:,} of {limit:,} characters" + ("" if n <= limit else " — over limit"),
            "source": source,
            "pass": n <= limit,
        }
    )

    # 2. FTC disclosure — sponsored content must carry the disclosure tag.
    disclosure = (rules.get("sponsoredDisclosure") or "#ad").lower()
    if sponsored:
        present = disclosure in full.lower()
        checks.append(
            {
                "rule": "ftc_disclosure",
                "detail": (
                    f"Sponsored draft carries “{disclosure}”"
                    if present
                    else f"Sponsored draft is missing the required “{disclosure}” disclosure"
                ),
                "source": FTC_SOURCE,
                "pass": present,
            }
        )

    # 3. Banned phrases — the creator owns this list.
    banned = [p.lower() for p in rules.get("bannedPhrases", [])]
    found = sorted({p for p in banned if p in full.lower()})
    checks.append(
        {
            "rule": "banned_phrases",
            "detail": "No banned phrases found" if not found else "Banned phrase: " + ", ".join(f"“{p}”" for p in found),
            "source": USER_RULES,
            "pass": not found,
        }
    )

    # 4. Hashtag cap
    max_tags = int(rules.get("maxHashtags", 4))
    n_tags = len(hashtags) + text.count("#") - sum(t in text for t in hashtags)
    n_tags = max(n_tags, len(hashtags))
    if hashtags or "#" in text:
        checks.append(
            {
                "rule": "hashtag_cap",
                "detail": f"{n_tags} of {max_tags} allowed",
                "source": USER_RULES,
                "pass": n_tags <= max_tags,
            }
        )

    # 5. Emoji cap
    max_emoji = int(rules.get("maxEmoji", 3))
    n_emoji = len(_EMOJI_RE.findall(full))
    if n_emoji:
        checks.append(
            {
                "rule": "emoji_cap",
                "detail": f"{n_emoji} of {max_emoji} allowed",
                "source": USER_RULES,
                "pass": n_emoji <= max_emoji,
            }
        )

    # 6. Duplicate distance vs everything already shipped
    worst = 0.0
    for past in past_texts:
        worst = max(worst, difflib.SequenceMatcher(None, text.lower(), past.lower()).ratio())
    checks.append(
        {
            "rule": "duplicate_distance",
            "detail": (
                f"{int(worst * 100)}% similar to your closest shipped post"
                + ("" if worst < DUPLICATE_THRESHOLD else " — too close")
            ),
            "source": "PostPilot duplicate check (difflib)",
            "pass": worst < DUPLICATE_THRESHOLD,
        }
    )

    # 7. Atom citations resolve — the agent never invents the creator's life.
    if atom_ids:
        missing = [a for a in atom_ids if a not in known_atoms]
        titles = sorted({known_atoms[a] for a in atom_ids if a in known_atoms})
        checks.append(
            {
                "rule": "atom_citation",
                "detail": (
                    "Grounded in your Library: " + " · ".join(titles)
                    if not missing
                    else "Cites Library atoms that don't exist: " + ", ".join(missing)
                ),
                "source": GROUNDING,
                "pass": not missing,
            }
        )
    else:
        checks.append(
            {
                "rule": "atom_citation",
                "detail": "No personal-story claims cited from the Library",
                "source": GROUNDING,
                "pass": True,
            }
        )

    return checks


def blocked(checks: list[dict]) -> bool:
    return any(not c["pass"] for c in checks)
