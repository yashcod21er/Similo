"""Does the page mention the brand (in its title, its text or inside its images)?

A look-alike site often writes the brand name, or a spelling that only *looks* like it. Two
passes are made over each piece of text:

1. exact: the brand term, ignoring upper/lower case and differences in spaces, hyphens,
   dots and underscores ("Acme Pay", "acme-pay", "AcmePay").
2. look-alike: both the term and the text are reduced to a "skeleton" in which characters
   that look alike become the same character: Cyrillic/Greek letters (а, о, р ...), digits
   used as letters (0 for o, 1 for l or i, 3 for e ...), "rn" for m, "vv" for w, "cl" for d.
   A match that only exists in this pass is reported as a look-alike spelling.

Text that is the brand's own official domain (for example "support@acme.com" or a link to
acme.com) is removed before searching, so a page that merely links to the real site is not
treated as using the brand's name.

Matching is on whole words (the character before and after must not be a letter or digit),
so the brand "Meta" does not match "metadata".
"""

import re
import unicodedata
from dataclasses import dataclass
from typing import Literal

Where = Literal["title", "text", "image"]

MIN_TERM_CHARS = 3  # shorter terms ("AI", "Go") match far too much to be evidence
MIN_LOOKALIKE_TERM_CHARS = 4  # look-alike matching is looser, so it needs longer terms
MAX_TERMS = 51  # the brand name plus up to 50 keywords
_SEPARATORS = r"[\s\-_.]?"  # zero or one separator between two letters of a term

# Letters from other alphabets that are drawn like a Latin letter (lower case; text is
# case-folded first). Kept in step with backend/src/modules/monitoring/similarity.ts.
_HOMOGLYPHS = {
    # Cyrillic
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "у": "y", "і": "i",
    "ј": "j", "к": "k", "м": "m", "т": "t", "в": "b", "н": "h", "ѕ": "s", "ԁ": "d",
    "ӏ": "l", "һ": "h", "ԛ": "q", "ԝ": "w",
    # Greek
    "α": "a", "β": "b", "ε": "e", "ζ": "z", "η": "h", "ο": "o", "ρ": "p", "τ": "t",
    "χ": "x", "υ": "y", "ν": "v", "ι": "i", "κ": "k", "μ": "m",
    # Latin variants without a decomposition
    "ɡ": "g", "ı": "i", "ɩ": "i",
}  # fmt: skip

# Digits and symbols people use instead of letters. i, l, 1 and | are one class ("l"),
# because in many fonts they cannot be told apart.
_LEET = {
    "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s",
    "|": "l", "i": "l",
}  # fmt: skip

_SEQUENCES = (("rn", "m"), ("vv", "w"), ("cl", "d"))


def _light(text: str) -> str:
    """NFKC (full-width letters become normal) and lower case; nothing else changes."""
    return unicodedata.normalize("NFKC", text).casefold()


def skeleton(text: str) -> str:
    """Reduce look-alike characters to one form (see the module docstring)."""
    decomposed = unicodedata.normalize("NFKD", _light(text))
    without_marks = "".join(char for char in decomposed if not unicodedata.combining(char))
    mapped = "".join(_LEET.get(c, c) for c in (_HOMOGLYPHS.get(c, c) for c in without_marks))
    for sequence, replacement in _SEQUENCES:
        mapped = mapped.replace(sequence, replacement)
    return mapped


def _tokens(text: str) -> list[str]:
    return re.findall(r"[^\W_]+", text)


def _term_pattern(prepared_term: str) -> re.Pattern[str] | None:
    tokens = _tokens(prepared_term)
    letters = "".join(tokens)
    if not letters:
        return None
    # Between any two letters allow one separator ("a c m e", "acme-pay" for "acmepay").
    # Between words allow any run of separators.
    words = [_SEPARATORS.join(re.escape(char) for char in token) for token in tokens]
    body = r"[\s\-_.]*".join(words)
    return re.compile(rf"(?<![^\W_]){body}(?![^\W_])")


def official_domain_of(domain: str) -> str:
    domain = domain.strip().lower().rstrip(".")
    return domain.removeprefix("www.")


def is_official_domain(candidate: str, official_domains: list[str]) -> bool:
    candidate = official_domain_of(candidate)
    for official in official_domains:
        official = official_domain_of(official)
        if official and (candidate == official or candidate.endswith("." + official)):
            return True
    return False


def _without_official_domains(text: str, official_domains: list[str]) -> str:
    for official in official_domains:
        official = official_domain_of(official)
        if official:
            text = re.sub(rf"(?:[a-z0-9-]+\.)*{re.escape(official)}", " ", text)
    return text


@dataclass(frozen=True)
class Mention:
    term: str  # the brand name or keyword, as the brand owner wrote it
    where: Where  # title | text | image (OCR of the screenshot)
    lookalike: bool  # True when only the look-alike pass matched
    count: int


def find_mentions(
    *,
    name: str,
    keywords: list[str],
    official_domains: list[str],
    title: str,
    text: str,
    ocr_text: str,
) -> list[Mention]:
    """All places where a brand term (or a look-alike spelling of it) appears."""
    terms: list[str] = []
    for term in [name, *keywords][:MAX_TERMS]:
        term = " ".join(term.split())
        if term and term not in terms:
            terms.append(term)

    sources: list[tuple[Where, str]] = [("title", title), ("text", text), ("image", ocr_text)]
    prepared = [
        (where, _without_official_domains(_light(content), official_domains))
        for where, content in sources
        if content.strip()
    ]
    skeletons = [(where, skeleton(content)) for where, content in prepared]

    mentions: list[Mention] = []
    for term in terms:
        compact = "".join(_tokens(_light(term)))
        if len(compact) < MIN_TERM_CHARS:
            continue
        exact = _term_pattern(_light(term))
        loose = _term_pattern(skeleton(term)) if len(compact) >= MIN_LOOKALIKE_TERM_CHARS else None
        for (where, content), (_, skel) in zip(prepared, skeletons, strict=True):
            exact_count = len(exact.findall(content)) if exact else 0
            if exact_count:
                mentions.append(Mention(term, where, False, exact_count))
                continue
            loose_count = len(loose.findall(skel)) if loose else 0
            if loose_count:
                mentions.append(Mention(term, where, True, loose_count))
    return mentions
