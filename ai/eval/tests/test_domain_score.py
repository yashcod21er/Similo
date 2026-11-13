"""The Python port of the Phase 5 name score must agree with backend similarity.ts."""

import pytest

from eval.domain_score import domain_score, edit_distance, skeleton

BRAND = ("Norvane Bank", ["norvane", "norvane online banking"], ["norvane.example"])


def score(domain: str) -> int:
    return domain_score(domain, *BRAND)


def test_skeleton_maps_lookalike_letters_and_drops_punctuation() -> None:
    assert skeleton("norvane-bank") == "norvanebank"
    assert skeleton("nоrvаne") == "norvane"  # Cyrillic o and a
    assert skeleton("café") == "cafe"


def test_edit_distance_counts_a_swap_as_one() -> None:
    assert edit_distance("norvane", "norvane") == 0
    assert edit_distance("norvane", "norvaen") == 1
    assert edit_distance("norvane", "norvaane") == 1


@pytest.mark.parametrize(
    ("domain", "expected"),
    [
        ("norvane.test", 95),  # same name, different ending
        # Labels are reduced to letters and digits before comparing, so the hyphen rule
        # (0.88) of similarity.ts never applies; "name + word" lands on the 0.82 rule.
        ("norvane-login.example", 82),
        ("securenorvane.example", 82),  # name inside a longer label
        ("norvaane.example", 88),  # one-letter typo (ratio 1 - 1/8)
        ("hollis-bakery.example", 30),  # unrelated names give low scores
    ],
)
def test_domain_score_matches_the_typescript_rules(domain: str, expected: int) -> None:
    assert score(domain) == expected


def test_only_labels_before_the_ending_are_compared() -> None:
    assert score("example.com") < 40
