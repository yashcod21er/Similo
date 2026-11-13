"""Tests for the metric functions on tiny inputs whose answers are known by hand.

Run from `ai/`:  uv run pytest eval/tests
"""

import pytest

from eval import metrics


def test_confusion_counts_each_cell() -> None:
    labels = [True, True, True, False, False, False]
    predictions = [True, True, False, True, False, False]
    assert metrics.confusion(labels, predictions) == {"tp": 2, "fp": 1, "fn": 1, "tn": 2}


def test_confusion_rejects_different_lengths() -> None:
    with pytest.raises(ValueError, match="same length"):
        metrics.confusion([True], [True, False])


def test_precision_recall_f1() -> None:
    result = metrics.precision_recall_f1({"tp": 2, "fp": 1, "fn": 1, "tn": 2})
    assert result["precision"] == pytest.approx(2 / 3)
    assert result["recall"] == pytest.approx(2 / 3)
    assert result["f1"] == pytest.approx(2 / 3)


def test_precision_is_undefined_when_nothing_is_flagged() -> None:
    result = metrics.precision_recall_f1({"tp": 0, "fp": 0, "fn": 3, "tn": 5})
    assert result["precision"] is None
    assert result["recall"] == 0
    assert result["f1"] == 0  # positives exist but none were found


def test_f1_is_undefined_without_any_positive() -> None:
    result = metrics.precision_recall_f1({"tp": 0, "fp": 0, "fn": 0, "tn": 4})
    assert result["recall"] is None
    assert result["f1"] is None


def test_f1_is_zero_when_flags_are_all_wrong() -> None:
    result = metrics.precision_recall_f1({"tp": 0, "fp": 2, "fn": 2, "tn": 0})
    assert result["precision"] == 0
    assert result["f1"] == 0


def test_evaluate_threshold_flags_at_or_above() -> None:
    labels = [True, True, False, False]
    scores = [80, 40, 40, 10]
    at_40 = metrics.evaluate_threshold(labels, scores, 40)
    assert (at_40["tp"], at_40["fp"], at_40["fn"], at_40["tn"]) == (2, 1, 0, 1)
    at_41 = metrics.evaluate_threshold(labels, scores, 41)
    assert (at_41["tp"], at_41["fp"], at_41["fn"], at_41["tn"]) == (1, 0, 1, 2)


def test_roc_auc_perfect_inverted_and_random() -> None:
    labels = [True, True, False, False]
    assert metrics.roc_auc(labels, [90, 80, 20, 10]) == 1.0
    assert metrics.roc_auc(labels, [10, 20, 80, 90]) == 0.0
    assert metrics.roc_auc(labels, [50, 50, 50, 50]) == 0.5


def test_roc_auc_known_value_with_a_tie() -> None:
    # positives 0.8, 0.4; negatives 0.4, 0.1 -> pairs: 0.8>0.4, 0.8>0.1, 0.4=0.4 (half), 0.4>0.1
    assert metrics.roc_auc([True, True, False, False], [0.8, 0.4, 0.4, 0.1]) == pytest.approx(0.875)


def test_roc_auc_needs_both_classes() -> None:
    assert metrics.roc_auc([True, True], [1, 2]) is None


def test_best_f1_threshold_prefers_the_lowest_on_a_tie() -> None:
    labels = [True, True, False, False]
    scores = [70, 60, 30, 20]
    sweep = metrics.threshold_sweep(labels, scores, [10, 40, 50, 65, 80])
    best = metrics.best_f1_threshold(sweep)
    assert best is not None
    assert best["threshold"] == 40
    assert best["f1"] == 1.0


def test_best_f1_threshold_is_none_without_positives() -> None:
    sweep = metrics.threshold_sweep([False, False], [10, 20], [5, 50])
    assert metrics.best_f1_threshold(sweep) is None


def test_distribution_and_percentile() -> None:
    result = metrics.distribution([0, 10, 20, 30, 40])
    assert result["n"] == 5
    assert result["median"] == 20
    assert result["p25"] == 10
    assert result["p75"] == 30
    assert result["mean"] == 20
    assert metrics.distribution([])["median"] is None
    assert metrics.percentile([1, 2, 3, 4], 50) == pytest.approx(2.5)


def test_histogram_puts_the_top_edge_in_the_last_bucket() -> None:
    counts = metrics.histogram([0, 9, 10, 55, 99, 100], bins=10, low=0, high=100)
    assert counts == [2, 1, 0, 0, 0, 1, 0, 0, 0, 2]


def test_latency_summary() -> None:
    result = metrics.latency_summary([100, 200, 300, 400, 1000])
    assert result["n"] == 5
    assert result["p50"] == 300
    assert result["max"] == 1000
    assert result["mean"] == pytest.approx(400)
