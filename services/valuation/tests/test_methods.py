import math
import unittest

from services.valuation.engine.gates import apply_gates
from services.valuation.engine.methods import run_method
from services.valuation.engine.route import Route, RouteInput
from services.valuation.engine.rates import RateInputs
from services.valuation.engine.scenarios import build_cases, reverse_growth


def rates() -> RateInputs:
    return RateInputs(
        discount_rates={1: 0.09, 2: 0.09, 3: 0.095, 4: 0.095, 5: 0.10, 6: 0.10, 7: 0.105, 8: 0.105, 9: 0.11, 10: 0.11},
        beta_adj=1.1,
        erp=0.0475,
        size_premium=0.0,
        distress_premium=0.0,
        cost_of_equity=0.10,
        cost_of_debt=0.06,
        wacc=0.09,
        terminal_growth=0.03,
    )


def inputs(**overrides):
    value = {
        "price": 100.0,
        "shares_outstanding": 100.0,
        "cash": 100.0,
        "debt": 200.0,
        "revenue": 1_000.0,
        "fcf": 80.0,
        "ebitda": 150.0,
        "ebit": 120.0,
        "net_income": 90.0,
        "book_equity": 900.0,
        "roe": 0.12,
        "affo": 70.0,
        "nav": 1_200.0,
        "growth": 0.15,
        "margin": 0.15,
        "terminal_growth": 0.03,
        "currency": "USD",
    }
    value.update(overrides)
    return value


class MethodCoverageTests(unittest.TestCase):
    def test_profitable_growth_and_build_out_are_positive_and_traceable(self):
        for family in ("profitable-growth", "build-out"):
            route = Route(family, 13 if family == "profitable-growth" else 12, 100.0)
            result = run_method(route, inputs(fcf=80, growth=0.20, capex=260), rates())
            self.assertEqual(result.status, "supported")
            self.assertGreater(result.base, 0)
            self.assertTrue(result.trace_id)

    def test_funded_growth_requires_funding_evidence_and_can_value(self):
        route = Route("funded-growth", 9, 70.0)
        result = run_method(route, inputs(fcf=-40, cash=400, debt=50, growth=0.35), rates())
        self.assertEqual(result.status, "supported")
        self.assertGreater(result.base, 0)
        blocked = run_method(route, inputs(fcf=-40, cash=10, debt=200, growth=0.35), rates())
        self.assertIn(blocked.status, {"partial", "unavailable", "refused"})
        blocked_without_debt = run_method(route, inputs(fcf=-100, cash=10, debt=0, growth=0.35), rates())
        self.assertIn(blocked_without_debt.status, {"partial", "unavailable", "refused"})

    def test_specialist_routes_do_not_inherit_generic_dcf(self):
        cases = [
            ("bank", {"book_equity": 900, "roe": 0.14}),
            ("reit", {"affo": 70, "nav": 1_200}),
            ("cyclical", {"ebitda": 150, "normalized_ebitda": 180}),
            ("distressed", {"cash": 20, "debt": 500, "asset_value": 1_500, "recovery_rate": 0.45}),
        ]
        for family, extra in cases:
            result = run_method(Route(family, 1, 80), inputs(**extra), rates())
            self.assertEqual(result.status, "supported", family)
            self.assertNotEqual(result.method, "generic-dcf")
            self.assertGreater(result.base, 0)

    def test_shell_otc_crypto_and_missing_facts_are_refused_or_facts_only(self):
        for family in ("shell", "untradeable", "crypto"):
            result = run_method(Route(family, 1, 0), inputs(), rates())
            self.assertIn(result.status, {"refused", "facts-only", "unavailable"})
            self.assertIsNone(result.base)


class ScenarioTests(unittest.TestCase):
    def test_scenarios_are_ordered_joint_and_reproducible(self):
        route = Route("profitable-growth", 13, 100)
        result = run_method(route, inputs(growth=0.18), rates())
        one = build_cases(inputs(growth=0.18), result, 0.30)
        two = build_cases(inputs(growth=0.18), result, 0.30)
        self.assertLessEqual(one.bear.value, one.base.value)
        self.assertLessEqual(one.base.value, one.bull.value)
        self.assertEqual(one, two)
        self.assertEqual(one.base.assumptions["terminal_growth"], one.base.assumptions["terminal_growth"])
        self.assertEqual(one.bear.assumptions["growth"], result.assumptions["bear_growth"])
        self.assertEqual(one.bull.assumptions["growth"], result.assumptions["bull_growth"])

    def test_zero_growth_is_preserved_as_zero(self):
        result = run_method(Route("profitable-growth", 13, 100), inputs(growth=0.0), rates())
        self.assertEqual(result.assumptions["growth"], 0.0)

    def test_reverse_dcf_round_trip_is_bounded(self):
        route = Route("profitable-growth", 13, 100)
        result = run_method(route, inputs(growth=0.12), rates())
        implied = reverse_growth(inputs(growth=0.12), result.base, rates())
        self.assertIsNotNone(implied)
        self.assertAlmostEqual(implied.value, 0.12, delta=0.002)
        self.assertIsNone(reverse_growth(inputs(fcf=-1), 100, rates()))
        normalised = inputs(fcf=None, fcf_ttm=80, growth=0.12)
        self.assertIsNotNone(reverse_growth(normalised, result.base, rates()))

    def test_dcf_net_cash_additivity_and_price_independence(self):
        route = Route("profitable-growth", 13, 100)
        low_price = run_method(route, inputs(price=20, cash=100, debt=0), rates())
        high_price = run_method(route, inputs(price=500, cash=100, debt=0), rates())
        no_cash = run_method(route, inputs(price=20, cash=0, debt=0), rates())
        self.assertEqual(low_price.base, high_price.base)
        self.assertAlmostEqual(low_price.base - no_cash.base, 1.0, places=8)

    def test_dcf_uses_normalised_diluted_shares_and_rates_are_decimal(self):
        one_share = run_method(Route("profitable-growth", 13, 100), inputs(fcf=80, shares_outstanding=1, cash=0, debt=0), rates())
        one_hundred_shares = run_method(Route("profitable-growth", 13, 100), inputs(fcf=80, shares_outstanding=100, cash=0, debt=0), rates())
        self.assertAlmostEqual(one_share.base / one_hundred_shares.base, 100.0, places=8)


class GateTests(unittest.TestCase):
    def test_gates_enforce_positive_ordering_and_small_cap_clip(self):
        route = Route("profitable-growth", 13, 100, ("small-cap",))
        result = run_method(route, inputs(), rates())
        gated = apply_gates(result, route)
        self.assertEqual(gated.status, "supported")
        self.assertLessEqual(gated.bear, gated.base)
        self.assertLessEqual(gated.base, gated.bull)
        self.assertTrue(math.isfinite(gated.base))
        self.assertIn("small-cap", gated.flags)

    def test_bad_or_unavailable_results_fail_closed(self):
        result = run_method(Route("facts-only", 0, 0), inputs(), rates())
        gated = apply_gates(result, Route("facts-only", 0, 0))
        self.assertNotEqual(gated.status, "supported")
        self.assertIsNone(gated.base)


if __name__ == "__main__":
    unittest.main()
