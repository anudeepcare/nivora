import unittest

from services.valuation.portfolio.risk import portfolio_risk
from services.valuation.validation.backtest import evaluate_backtest
from services.valuation.validation.metrics import monitor_outputs


class ValidationTests(unittest.TestCase):
    def test_backtest_uses_only_returns_after_each_as_of_and_reports_coverage(self):
        outputs = [
            {"symbol": "A", "asOf": "2026-01-01", "status": "ok", "price": 100, "cases": {"base": {"value": 110}}, "family": "mature"},
            {"symbol": "B", "asOf": "2026-01-01", "status": "refused", "price": None, "cases": {"base": {"value": None}}, "family": "crypto"},
        ]
        realised = {"A": [("2025-12-31", 0.99), ("2026-02-01", 0.10)], "B": [("2026-02-01", -0.02)]}
        report = evaluate_backtest(outputs, realised)
        self.assertEqual(report.coverage, 0.5)
        self.assertAlmostEqual(report.bias, 0.0, places=8)
        self.assertGreaterEqual(report.refusal_honesty, 1.0)
        self.assertIn("refused", report.bucket_counts)

    def test_small_holdout_reports_unavailable_rank_and_decile_gates(self):
        report = evaluate_backtest([{"symbol": "A", "asOf": "2026-01-01", "status": "ok", "price": 100, "cases": {"base": {"value": 110}}, "family": "mature"}], {"A": [("2026-02-01", 0.10)]})
        self.assertIsNone(report.rank_power)
        self.assertIsNone(report.decile_spread)
        self.assertTrue(any("insufficient" in flag.lower() for flag in report.flags))

    def test_monitor_detects_drift_refusals_and_extreme_outputs(self):
        current = [
            {"symbol": "A", "status": "ok", "confidence": 95, "cases": {"bear": {"value": 1}, "base": {"value": 100}, "bull": {"value": 1000}}, "family": "mature"},
            {"symbol": "B", "status": "refused", "confidence": 0, "flags": ["missing"], "family": "unknown"},
        ]
        prior = [{"symbol": "A", "status": "ok", "confidence": 75, "family": "mature"}, {"symbol": "B", "status": "ok", "confidence": 70, "family": "mature"}]
        events = monitor_outputs(current, prior)
        self.assertTrue(any(event.kind == "extreme-output" for event in events))
        self.assertTrue(any(event.kind == "refusal-rate" for event in events))
        self.assertTrue(any(event.kind == "confidence-drift" for event in events))


class RiskTests(unittest.TestCase):
    def test_portfolio_risk_hand_computed_concentration_var_es_and_scenarios(self):
        positions = [{"symbol": "A", "value": 60}, {"symbol": "B", "value": 40}]
        scenarios = {
            "A": {"returns": [("2026-01-01", -0.10), ("2026-02-01", 0.00), ("2026-03-01", 0.10)], "bear": 80, "base": 100, "bull": 120, "price": 100},
            "B": {"returns": [("2026-01-01", -0.05), ("2026-02-01", 0.00), ("2026-03-01", 0.05)], "bear": 90, "base": 100, "bull": 110, "price": 100},
        }
        risk = portfolio_risk(positions, scenarios)
        self.assertAlmostEqual(risk.concentration, 0.52, places=8)
        self.assertGreater(risk.var_95, 0)
        self.assertGreaterEqual(risk.expected_shortfall_95, risk.var_95)
        self.assertAlmostEqual(risk.scenario_contribution["bear"], -0.16, places=8)

    def test_invalid_positions_do_not_poison_risk_summary(self):
        risk = portfolio_risk([{"symbol": "BAD", "value": -1}, {"symbol": "A", "value": 100}], {"A": {"returns": [("2026-01-01", 0), ("2026-02-01", 0.01)]}})
        self.assertEqual(risk.coverage, 1.0)
        self.assertTrue(all(value == value for value in risk.correlation.values()))

    def test_duplicate_lots_are_aggregated_and_empty_scenarios_are_not_coverage(self):
        risk = portfolio_risk([{"symbol": "A", "value": 60}, {"symbol": "A", "value": 40}, {"symbol": "B", "value": 100}], {"A": {"returns": [("2026-01-01", 0), ("2026-02-01", 0.01)]}, "B": {}})
        self.assertEqual(risk.coverage, 0.5)
        self.assertAlmostEqual(risk.concentration, 1.0, places=8)

    def test_undated_series_cannot_claim_full_risk_coverage(self):
        risk = portfolio_risk(
            [{"symbol": "A", "value": 50}, {"symbol": "B", "value": 50}],
            {"A": {"returns": [("2026-01-01", -0.1), ("2026-02-01", 0.1)]}, "B": {"returns": [("bad", 0.0), ("also-bad", 0.1)]}},
        )
        self.assertEqual(risk.coverage, 0.5)
        self.assertIn("partial-coverage", risk.flags)


if __name__ == "__main__":
    unittest.main()
