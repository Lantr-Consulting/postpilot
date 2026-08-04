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
    "x": (280, "X 发布格式：280 字符"),
    "bluesky": (300, "Bluesky 发布格式：300 字符"),
    "instagram": (2200, "Instagram 发布格式：2,200 字符"),
    "linkedin": (3000, "LinkedIn 发布格式：3,000 字符"),
    "youtube": (5000, "YouTube 视频说明：5,000 字符"),
}

FTC_SOURCE = "美国联邦贸易委员会（FTC）广告背书指南 · 16 CFR 255"
USER_RULES = "你的内容检查规则"
GROUNDING = "PostPilot 材料引用规则"

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
            "detail": f"已使用 {n:,} 个字符，上限 {limit:,}" + ("" if n <= limit else "，已经超出"),
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
                    f"推广内容已经包含“{disclosure}”说明"
                    if present
                    else f"推广内容缺少规定的“{disclosure}”说明"
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
            "detail": "没有发现禁用表达" if not found else "发现禁用表达：" + "、".join(f"“{p}”" for p in found),
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
                "detail": f"使用了 {n_tags} 个话题标签，上限为 {max_tags} 个",
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
                "detail": f"使用了 {n_emoji} 个表情符号，上限为 {max_emoji} 个",
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
                f"与最相近的已发布内容有 {int(worst * 100)}% 相似"
                + ("" if worst < DUPLICATE_THRESHOLD else "，相似度过高")
            ),
            "source": "PostPilot 重复内容检查",
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
                    "使用材料库内容：" + " · ".join(titles)
                    if not missing
                    else "引用了不存在的材料：" + "、".join(missing)
                ),
                "source": GROUNDING,
                "pass": not missing,
            }
        )
    else:
        checks.append(
            {
                "rule": "atom_citation",
                "detail": "没有使用需要从材料库引用的个人经历",
                "source": GROUNDING,
                "pass": True,
            }
        )

    return checks


def blocked(checks: list[dict]) -> bool:
    return any(not c["pass"] for c in checks)
