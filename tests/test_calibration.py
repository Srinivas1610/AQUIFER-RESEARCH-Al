"""Tests for Conformal Prediction Interval Calibration."""
import sys
from pathlib import Path
import pytest
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
from gwml.calibration.conformal import (
    compute_conformity_scores,
    fit_split_conformal,
    expand_prediction_intervals,
    evaluate_prediction_intervals
)


def test_conformity_scores_inside_interval():
    """Points inside interval have conformity score 0."""
    y = np.array([5.0, 10.0, 15.0])
    L = np.array([4.0, 8.0, 12.0])
    U = np.array([6.0, 12.0, 16.0])

    scores = compute_conformity_scores(y, L, U)
    np.testing.assert_array_equal(scores, [0.0, 0.0, 0.0])


def test_conformity_scores_outside_interval():
    """Points outside interval have positive conformity scores equal to distance to interval."""
    y = np.array([3.0, 14.0])
    L = np.array([4.0, 8.0])
    U = np.array([6.0, 12.0])

    scores = compute_conformity_scores(y, L, U)
    np.testing.assert_array_almost_equal(scores, [1.0, 2.0])


def test_conformal_expansion_increases_coverage():
    """Applying conformal expansion strictly increases empirical coverage."""
    np.random.seed(42)
    y_cal = np.random.normal(10, 2, 200)
    # Start with narrow intervals (e.g. +/- 1)
    L_cal = y_cal - 1.0
    U_cal = y_cal + 1.0

    # Add noise to ground truth so some fall outside
    y_actual = y_cal + np.random.normal(0, 1.5, 200)

    pre_eval = evaluate_prediction_intervals(y_actual, L_cal, U_cal)
    s_hat, _ = fit_split_conformal(y_actual, L_cal, U_cal, nominal_coverage=0.90)

    assert s_hat > 0.0, "s_hat must be positive when undercoverage occurs"

    L_exp, U_exp = expand_prediction_intervals(L_cal, U_cal, s_hat)
    post_eval = evaluate_prediction_intervals(y_actual, L_exp, U_exp)

    assert post_eval["picp"] >= pre_eval["picp"]
    assert post_eval["picp"] >= 0.88, f"Coverage {post_eval['picp']} should reach near nominal 90%"
    assert post_eval["mpiw"] > pre_eval["mpiw"]
