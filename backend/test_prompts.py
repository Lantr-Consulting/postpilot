"""Patch prompts with asserts — the first sample's lesson, made permanent.

Two prompt 'fixes' in sample one silently no-opped when the target text
drifted. These tests pin the load-bearing sentences: if a refactor moves or
rewords them, the suite fails instead of the behavior quietly regressing.
Run: pytest.
"""

import os

# The prompt tests need no real backend — stub the env before imports pull
# in auth/db, which read these at import time.
os.environ.setdefault("SUPABASE_URL", "http://example.invalid")
os.environ.setdefault("SUPABASE_SECRET_KEY", "test-only")
os.environ.setdefault("SUPABASE_PUBLISHABLE_KEY", "test-only")

import agent  # noqa: E402
import main  # noqa: E402


def test_grounding_rule_exists_and_comes_last():
    # The rule that stopped invented clients only worked when repeated AFTER
    # the profile context. FINAL_CHECK is that repetition; it must survive.
    assert "FINAL CHECK" in main.FINAL_CHECK
    assert "not even with placeholders" in main.FINAL_CHECK
    assert "NEVER invent the creator's life" in main.CHAT_SYSTEM


def test_interpreter_forbids_invented_biography():
    assert "never invent biography" in main.INTERPRET_SYSTEM
    assert "empty field beats an invented one" in main.INTERPRET_SYSTEM


def test_miner_forbids_embellishment():
    assert "never embellish or invent" in agent._MINE_SYSTEM


def test_drafts_require_atoms_for_personal_claims():
    assert "ONLY come from" in agent._DRAFT_SYSTEM
    assert "atomIds" in agent._DRAFT_SYSTEM


def test_ideas_require_evidence_and_real_arcs():
    assert "at least one evidence row" in agent._IDEAS_SYSTEM
    assert "narrative arc titles" in agent._IDEAS_SYSTEM


def test_review_never_invents_metrics():
    assert "Never invent" in agent._REVIEW_SYSTEM


def test_repurpose_grounds_every_idea():
    assert "nothing invented" in agent._REPURPOSE_SYSTEM
