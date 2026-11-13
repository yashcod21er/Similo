"""Python port of the Phase 5 domain-name score (backend/src/modules/monitoring/similarity.ts).

The evaluation needs the same `domainScore` the monitoring step would send to the AI service,
so this mirrors `assessDomainSimilarity` (confusable letters, 0.95 / 0.88 / 0.82 rules, edit
distance with transpositions). If the TypeScript file changes, update this port and its tests.
"""

from __future__ import annotations

import re
import unicodedata

# Cyrillic and Greek letters that look like Latin ones (same table as similarity.ts).
CONFUSABLES: dict[str, str] = {
    **dict(zip("аеорсхуіјкмтвн", "aeopcxyijkmtbh", strict=True)),
    **dict(zip("ΑΒΕΖΗΙΚΜΝΟΡΤΧΥ", "abezhikmnoptxy", strict=True)),
    **dict(zip("αβεζηορτχυνικμ", "abezhoptxyvikm", strict=True)),
}

_NON_ALNUM = re.compile(r"[^a-z0-9]")


def to_unicode(domain: str) -> str:
    """Decode punycode labels (xn--...) the way Node's domainToUnicode does."""
    labels = []
    for label in domain.split("."):
        if label.lower().startswith("xn--"):
            try:
                label = label.encode("ascii").decode("idna")
            except UnicodeError:
                pass
        labels.append(label)
    return ".".join(labels)


def skeleton(value: str) -> str:
    """Lower-case, strip accents, map look-alike letters, keep only a-z and 0-9."""
    text = unicodedata.normalize("NFKD", to_unicode(value)).lower()
    chars = [c for c in text if not unicodedata.category(c).startswith("M")]
    return _NON_ALNUM.sub("", "".join(CONFUSABLES.get(c, c) for c in chars))


def edit_distance(left: str, right: str) -> int:
    """Damerau-Levenshtein (optimal string alignment) distance."""
    rows = [[0] * (len(right) + 1) for _ in range(len(left) + 1)]
    for i in range(len(left) + 1):
        rows[i][0] = i
    for j in range(len(right) + 1):
        rows[0][j] = j
    for i in range(1, len(left) + 1):
        for j in range(1, len(right) + 1):
            cost = 0 if left[i - 1] == right[j - 1] else 1
            rows[i][j] = min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
            if i > 1 and j > 1 and left[i - 1] == right[j - 2] and left[i - 2] == right[j - 1]:
                rows[i][j] = min(rows[i][j], rows[i - 2][j - 2] + 1)
    return rows[len(left)][len(right)]


def similarity(label: str, alias: str) -> float:
    if not label or not alias:
        return 0.0
    if label == alias:
        return 0.95
    if label.startswith(f"{alias}-") or label.endswith(f"-{alias}"):
        return 0.88
    if alias in label:
        return 0.82
    if len(alias) < 4:
        return 0.0
    distance = edit_distance(label, alias)
    ratio = 1 - distance / max(len(label), len(alias))
    if len(label) > len(alias) * 1.9:
        return min(ratio, 0.69)
    return ratio


def alias_keys(name: str, keywords: list[str], official_domains: list[str]) -> list[str]:
    values = [name, *keywords, *(d.split(".")[0] for d in official_domains)]
    keys = [skeleton(v) for v in values]
    return list(dict.fromkeys(k for k in keys if len(k) >= 3))


def domain_score(domain: str, name: str, keywords: list[str], official_domains: list[str]) -> int:
    """Phase 5 name score 0-100 (0 when nothing resembles the protected name)."""
    labels = to_unicode(domain).lower().split(".")[:-1]
    aliases = alias_keys(name, keywords, official_domains)
    best = 0.0
    for label in labels:
        normalized = skeleton(label)
        for alias in aliases:
            best = max(best, similarity(normalized, alias))
    return int(best * 100 + 0.5)
