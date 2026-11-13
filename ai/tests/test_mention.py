"""Brand mentions: exact, spacing variants, confusable spellings, official domains ignored."""

import pytest

from app.analysis.mention import (
    Mention,
    find_mentions,
    is_official_domain,
    skeleton,
)


def _find(
    name: str = "Acme",
    *,
    title: str = "",
    text: str = "",
    ocr: str = "",
    keywords: list[str] | None = None,
    official: list[str] | None = None,
) -> list[Mention]:
    return find_mentions(
        name=name,
        keywords=keywords or [],
        official_domains=official if official is not None else ["acme.com"],
        title=title,
        text=text,
        ocr_text=ocr,
    )


def test_exact_mention_in_title_text_and_ocr() -> None:
    mentions = _find(title="Acme - Sign in", text="Welcome to ACME. Acme is great.", ocr="acme")
    assert {(m.where, m.lookalike) for m in mentions} == {
        ("title", False),
        ("text", False),
        ("image", False),
    }
    assert next(m for m in mentions if m.where == "text").count == 2


def test_no_mention() -> None:
    assert _find(title="Joe's Pizza", text="Order a pizza online.") == []


def test_whole_words_only() -> None:
    assert _find("Meta", text="Our metadata service and metals") == []
    assert _find("Meta", text="Sign in to Meta.") != []
    assert _find("Acme", text="acmeology") == []


@pytest.mark.parametrize(
    "variant", ["acme-pay", "Acme Pay", "AcmePay", "acme_pay", "acme.pay", "ACME  PAY"]
)
def test_hyphen_space_and_case_variants(variant: str) -> None:
    mentions = _find("Acme Pay", text=f"Log in to {variant} now")
    assert mentions and not mentions[0].lookalike


def test_single_word_brand_matches_spaced_out_variant() -> None:
    assert _find("Acme", text="A C M E secure login")[0].lookalike is False
    assert _find("acmepay", text="Sign in to acme-pay today") != []


@pytest.mark.parametrize(
    ("brand", "spoof"),
    [
        ("Paypal", "Paypa1"),  # 1 for l
        ("Paypal", "PayPaI"),  # capital i for l
        ("Google", "G00gle"),  # zeros for o
        ("Google", "Gооgle"),  # Cyrillic o
        ("Google", "Gοogle"),  # Greek omicron
        ("Paypal", "Раypal"),  # Cyrillic R-like P and a
        ("Acme", "Acrne"),  # rn for m
        ("Twitter", "Tvvitter"),  # vv for w
        ("Dropbox", "Droрbox"),  # Cyrillic p
        ("Amazon", "Amaz0n"),
        ("Apple", "Аррle"),  # Cyrillic A and p
        ("Microsoft", "Micr0s0ft"),
        ("Linkedin", "Linkedln"),  # lowercase L for i
        ("Acmé", "Acme"),  # accent differences count as look-alike
    ],
)
def test_confusable_spellings_are_found_and_marked_as_lookalike(brand: str, spoof: str) -> None:
    mentions = _find(brand, text=f"Welcome to {spoof}, please sign in", official=[])
    assert len(mentions) == 1
    assert mentions[0].lookalike is True
    assert mentions[0].where == "text"


def test_exact_spelling_wins_over_lookalike() -> None:
    mention = _find("Acme", text="Acme")[0]
    assert mention.lookalike is False


def test_lookalike_in_title_and_ocr() -> None:
    mentions = _find("Acme", title="Acrne Bank", ocr="Welcome to Acme")
    assert {(m.where, m.lookalike) for m in mentions} == {("title", True), ("image", False)}


def test_full_width_letters_are_exact_after_unicode_normalisation() -> None:
    assert _find("Acme", text="Ａｃｍｅ login")[0].lookalike is False


def test_unrelated_words_do_not_match_through_the_skeleton() -> None:
    assert _find("Acme", text="Acne cream, acre, ache") == []


def test_short_terms_are_ignored() -> None:
    assert _find("AI", text="AI is everywhere. Ai!") == []
    assert _find("Go", text="Let's go") == []


def test_lookalike_needs_four_letters() -> None:
    # "IBM" (3 letters) can match exactly, but not through the loose look-alike pass.
    assert _find("IBM", text="Welcome to IBM", official=[]) != []
    assert _find("IBM", text="Welcome to 1BM", official=[]) == []


def test_keywords_are_searched_too() -> None:
    mentions = _find("Acme", keywords=["super pay"], text="Open a Super-Pay account", official=[])
    assert [m.term for m in mentions] == ["super pay"]


def test_official_domain_text_is_ignored() -> None:
    assert _find(text="Questions? Visit https://www.acme.com/help or mail help@mail.acme.com") == []
    assert _find(text="See acme.com. ACME.COM is official.") == []
    # ...but the brand name next to it still counts.
    assert _find(text="Acme: see acme.com") != []


def test_other_domains_with_the_brand_name_still_count() -> None:
    assert _find(text="Log in at acme-login.com") != []
    assert _find(text="notacme.com") == []  # not a whole word


def test_is_official_domain() -> None:
    assert is_official_domain("acme.com", ["acme.com"])
    assert is_official_domain("WWW.Acme.com.", ["acme.com"])
    assert is_official_domain("login.acme.com", ["acme.com"])
    assert not is_official_domain("acme.com.evil.net", ["acme.com"])
    assert not is_official_domain("notacme.com", ["acme.com"])
    assert not is_official_domain("acme.com", [])


def test_skeleton_reduces_lookalikes_to_one_form() -> None:
    assert skeleton("Acrne") == skeleton("Acme")
    assert skeleton("PayPaI") == skeleton("Paypal") == skeleton("Paypa1")
    assert skeleton("G00gle") == skeleton("Gооgle") == skeleton("Google")
    assert skeleton("Tvvitter") == skeleton("Twitter")


def test_many_terms_and_long_text_stay_fast() -> None:
    text = ("lorem ipsum dolor sit amet " * 800)[:20_000]
    keywords = [f"keyword number {i}" for i in range(50)]
    assert _find("Acme", text=text, keywords=keywords) == []
