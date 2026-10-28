import unittest

from services.valuation.engine.capital_structure import (
    CapitalStructure,
    OptionGrant,
    diluted_shares,
)
from services.valuation.engine.rates import YieldCurve, build_rates
from services.valuation.engine.route import RouteInput, route_company


class RoutingTests(unittest.TestCase):
    def test_ordered_routes_cover_instruments_and_business_shapes(self):
        cases = [
            (RouteInput(asset_type="fund"), "fund", 1),
            (RouteInput(asset_type="crypto"), "crypto", 2),
            (RouteInput(asset_type="stock", otc=True, average_dollar_volume=40_000), "untradeable", 3),
            (RouteInput(asset_type="stock", bank=True, revenue_ttm=100, net_interest_income=65), "bank", 4),
            (RouteInput(asset_type="stock", insurer=True), "insurer", 5),
            (RouteInput(asset_type="stock", reit=True), "reit", 6),
            (RouteInput(asset_type="stock", revenue_ttm=400_000, market_cap=100_000_000, ebit_ttm=-1), "shell", 7),
            (RouteInput(asset_type="stock", revenue_ttm=100_000_000, interest_coverage=0.6, financial_debt=10, ebitda_ttm=1), "distressed", 8),
            (RouteInput(asset_type="stock", revenue_ttm=100_000_000, fcf_after_sbc=-1, revenue_growth_yoy=41), "funded-growth", 9),
            (RouteInput(asset_type="stock", revenue_ttm=100_000_000, fcf_after_sbc=-1, revenue_growth_yoy=2), "mature-loss-maker", 10),
            (RouteInput(asset_type="stock", revenue_ttm=100_000_000, sector="semiconductors", fcf_after_sbc=1), "cyclical", 11),
            (RouteInput(asset_type="stock", capex_ttm=50_000_000, depreciation_ttm=10_000_000, revenue_ttm=100_000_000, ocf_ttm=30_000_000, fcf_after_sbc=1), "build-out", 12),
            (RouteInput(asset_type="stock", revenue_ttm=100_000_000, fcf_after_sbc=1, revenue_growth_yoy=22), "profitable-growth", 13),
            (RouteInput(asset_type="stock", revenue_ttm=100_000_000, fcf_after_sbc=1, revenue_growth_yoy=2), "mature", 14),
        ]
        for item, family, rule in cases:
            result = route_company(item)
            self.assertEqual((result.family, result.rule), (family, rule))

    def test_small_and_illiquid_overlays_are_flags_not_ticker_exceptions(self):
        result = route_company(RouteInput(asset_type="stock", fcf_after_sbc=1, market_cap=100_000_000, average_dollar_volume=500_000))
        self.assertIn("small-cap", result.flags)
        self.assertIn("low-liquidity", result.flags)


class RatesTests(unittest.TestCase):
    def test_duration_curve_and_peer_beta_produce_year_specific_rates(self):
        rates = build_rates(
            RouteInput(market_cap=20_000_000_000, price=100, financial_debt=1_000_000_000, beta=1.4, peer_unlevered_beta=0.9, tax_rate=0.21),
            YieldCurve({1: 4.0, 5: 4.2, 10: 4.5}),
        )
        self.assertGreater(rates.discount_rates[10], rates.discount_rates[1])
        self.assertLess(rates.discount_rates[10], 0.5)
        self.assertGreater(rates.discount_rates[10], 0.04)
        self.assertGreater(rates.beta_adj, 0.9)
        self.assertGreater(rates.wacc, rates.terminal_growth)

    def test_degenerate_terminal_spread_is_raised_and_flagged(self):
        rates = build_rates(RouteInput(market_cap=1_000_000_000, price=100, beta=1.0, financial_debt=100_000_000_000, interest_coverage=10), YieldCurve({5: 1.0, 10: 2.5}))
        self.assertGreaterEqual(rates.wacc - rates.terminal_growth, 0.03)
        self.assertLess(rates.wacc, 1.0)
        self.assertIn("terminal spread widened", " ".join(rates.flags).lower())


class CapitalStructureTests(unittest.TestCase):
    def test_treasury_stock_method_adds_only_in_the_money_options_and_rsus(self):
        result = diluted_shares(
            CapitalStructure(
                basic_shares=100,
                rsus=5,
                options=(OptionGrant(quantity=20, strike=80), OptionGrant(quantity=10, strike=120)),
            ),
            100,
        )
        self.assertEqual(result.shares_diluted, 109)
        self.assertEqual(result.treasury_shares, 9)

    def test_missing_terms_are_flagged_without_inventing_dilution(self):
        result = diluted_shares(CapitalStructure(basic_shares=100, convertible_shares=None), 100)
        self.assertEqual(result.shares_diluted, 100)
        self.assertTrue(any("convertible" in flag.lower() for flag in result.flags))


if __name__ == "__main__":
    unittest.main()

