"""The engine's rules, tested against their published sources. Run: pytest."""

import editorial

RULES = {
    "bannedPhrases": ["game-changer", "crushing it"],
    "sponsoredDisclosure": "#ad",
    "maxHashtags": 2,
    "maxEmoji": 1,
}
ATOMS = {"atom-1": "Podcast ep. 41"}


def get(checks, rule):
    return next(c for c in checks if c["rule"] == rule)


def run(text="A plain post.", platform="x", hashtags=None, sponsored=False, atom_ids=None, past=None):
    return editorial.check_draft(
        platform, text, hashtags or [], sponsored, RULES, atom_ids or [], ATOMS, past or []
    )


def test_platform_length_pass_and_fail():
    ok = get(run("x" * 280), "platform_length")
    assert ok["pass"] and "280" in ok["detail"]
    over = get(run("x" * 281), "platform_length")
    assert not over["pass"] and "over limit" in over["detail"]
    assert over["source"] == "X docs: 280 chars"


def test_length_counts_hashtags():
    # 275 chars of text + " #ad" pushes past 280.
    checks = run("x" * 275, hashtags=["#advert"])
    assert not get(checks, "platform_length")["pass"]


def test_ftc_disclosure_blocks_sponsored_without_tag():
    c = get(run("Buy my thing", sponsored=True), "ftc_disclosure")
    assert not c["pass"]
    assert c["source"] == editorial.FTC_SOURCE
    assert editorial.blocked(run("Buy my thing", sponsored=True))


def test_ftc_disclosure_passes_with_tag_any_case():
    c = get(run("Buy my thing #AD", sponsored=True), "ftc_disclosure")
    assert c["pass"]


def test_no_ftc_row_when_not_sponsored():
    assert all(c["rule"] != "ftc_disclosure" for c in run("hello"))


def test_banned_phrase_case_insensitive():
    c = get(run("This is a GAME-CHANGER."), "banned_phrases")
    assert not c["pass"] and "game-changer" in c["detail"]


def test_hashtag_cap():
    assert get(run("post", hashtags=["#a", "#b"]), "hashtag_cap")["pass"]
    assert not get(run("post", hashtags=["#a", "#b", "#c"]), "hashtag_cap")["pass"]


def test_emoji_cap():
    assert get(run("nice 💪"), "emoji_cap")["pass"]
    assert not get(run("nice 💪🔥"), "emoji_cap")["pass"]


def test_duplicate_distance():
    text = "My client Dana asked for a fourth training day. We cut to two instead."
    near = text + " Twelve weeks later!"
    c = get(run(near, past=[text]), "duplicate_distance")
    assert not c["pass"]
    fresh = get(run("Something entirely new about recovery windows.", past=[text]), "duplicate_distance")
    assert fresh["pass"]


def test_atom_citation_resolves():
    ok = get(run(atom_ids=["atom-1"]), "atom_citation")
    assert ok["pass"] and "Podcast ep. 41" in ok["detail"]
    bad = get(run(atom_ids=["atom-99"]), "atom_citation")
    assert not bad["pass"] and "atom-99" in bad["detail"]


def test_clean_draft_ships():
    assert not editorial.blocked(run("A perfectly reasonable post about training."))
