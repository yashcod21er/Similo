"""Small, dependency-light metric functions (numpy only, no scikit-learn).

Labels are booleans (True = the page really is a look-alike). Scores are numbers where a
higher value means "more suspicious".
"""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np


def confusion(labels: Sequence[bool], predictions: Sequence[bool]) -> dict[str, int]:
    """Count true/false positives and negatives."""
    if len(labels) != len(predictions):
        raise ValueError("labels and predictions must have the same length")
    tp = fp = fn = tn = 0
    for label, predicted in zip(labels, predictions, strict=True):
        if predicted and label:
            tp += 1
        elif predicted:
            fp += 1
        elif label:
            fn += 1
        else:
            tn += 1
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn}


def _ratio(numerator: float, denominator: float) -> float | None:
    return None if denominator == 0 else numerator / denominator


def precision_recall_f1(counts: dict[str, int]) -> dict[str, float | None]:
    """Precision, recall and F1. Precision/recall are None when their denominator is zero.

    F1 is 0 when there are positives but none were found (recall 0), and None when there are
    no positives at all.
    """
    precision = _ratio(counts["tp"], counts["tp"] + counts["fp"])
    recall = _ratio(counts["tp"], counts["tp"] + counts["fn"])
    if recall is None:
        f1 = None
    elif precision is None or precision + recall == 0:
        f1 = 0.0
    else:
        f1 = 2 * precision * recall / (precision + recall)
    return {"precision": precision, "recall": recall, "f1": f1}


def evaluate_threshold(
    labels: Sequence[bool], scores: Sequence[float], threshold: float
) -> dict[str, float | int | None]:
    """Predict 'look-alike' when score >= threshold, then summarise."""
    counts = confusion(labels, [s >= threshold for s in scores])
    return {"threshold": threshold, **counts, **precision_recall_f1(counts)}


def roc_auc(labels: Sequence[bool], scores: Sequence[float]) -> float | None:
    """Area under the ROC curve = chance a random positive outscores a random negative.

    Ties count as half. Returns None when only one class is present.
    """
    y = np.asarray(labels, dtype=bool)
    s = np.asarray(scores, dtype=float)
    positives, negatives = s[y], s[~y]
    if positives.size == 0 or negatives.size == 0:
        return None
    greater = (positives[:, None] > negatives[None, :]).sum()
    equal = (positives[:, None] == negatives[None, :]).sum()
    return float((greater + 0.5 * equal) / (positives.size * negatives.size))


def threshold_sweep(
    labels: Sequence[bool], scores: Sequence[float], thresholds: Sequence[float]
) -> list[dict[str, float | int | None]]:
    return [evaluate_threshold(labels, scores, t) for t in thresholds]


def best_f1_threshold(
    sweep: list[dict[str, float | int | None]],
) -> dict[str, float | int | None] | None:
    """The sweep row with the highest F1 (the lowest threshold wins a tie); None if undefined."""
    scored = [row for row in sweep if row["f1"] is not None]
    if not scored:
        return None
    return max(scored, key=lambda row: (row["f1"], -float(row["threshold"] or 0)))  # type: ignore[arg-type]


def percentile(values: Sequence[float], q: float) -> float | None:
    """Linear-interpolated percentile (q from 0 to 100)."""
    if len(values) == 0:
        return None
    return float(np.percentile(np.asarray(values, dtype=float), q))


def distribution(values: Sequence[float]) -> dict[str, float | int | None]:
    """Five-number summary plus mean."""
    if len(values) == 0:
        return {
            "n": 0,
            "min": None,
            "p25": None,
            "median": None,
            "p75": None,
            "max": None,
            "mean": None,
        }
    arr = np.asarray(values, dtype=float)
    return {
        "n": int(arr.size),
        "min": float(arr.min()),
        "p25": float(np.percentile(arr, 25)),
        "median": float(np.percentile(arr, 50)),
        "p75": float(np.percentile(arr, 75)),
        "max": float(arr.max()),
        "mean": float(arr.mean()),
    }


def histogram(
    values: Sequence[float], bins: int = 10, low: float = 0, high: float = 100
) -> list[int]:
    """Counts in equal-width buckets; the top edge belongs to the last bucket."""
    counts = [0] * bins
    width = (high - low) / bins
    for value in values:
        index = min(bins - 1, max(0, int((value - low) // width)))
        counts[index] += 1
    return counts


def latency_summary(milliseconds: Sequence[float]) -> dict[str, float | int | None]:
    return {
        "n": len(milliseconds),
        "mean": float(np.mean(milliseconds)) if len(milliseconds) else None,
        "p50": percentile(milliseconds, 50),
        "p95": percentile(milliseconds, 95),
        "max": float(np.max(milliseconds)) if len(milliseconds) else None,
    }
