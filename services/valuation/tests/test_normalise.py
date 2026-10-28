import unittest

from services.valuation.engine.normalise import (
    CorporateAction,
    InputSnapshot,
    Observation,
    normalise,
    read_as_of,
)


def obs(metric, value, period_end, filed_at, period_type="Q", unit="USD", currency="USD", source="sec", start=None, status="clean"):
    return Observation(
        symbol="TEST",
        metric=metric,
        period_end=period_end,
        period_type=period_type,
        value=value,
        unit=unit,
        currency=currency,
        source=source,
        source_ref=f"{source}-{metric}-{filed_at}",
        filed_at=filed_at,
        start=start,
        status=status,
    )


class NormaliseTests(unittest.TestCase):
    def test_as_of_uses_latest_filed_restatement_without_future_leakage(self):
        rows = [
            obs("revenue", 100, "2025-12-31", "2026-02-01", period_type="FY"),
            obs("revenue", 120, "2025-12-31", "2026-04-01", period_type="FY"),
        ]
        self.assertEqual(read_as_of(rows, "TEST", "revenue", "FY", "2026-03-01").value, 100)
        self.assertEqual(read_as_of(rows, "TEST", "revenue", "FY", "2026-05-01").value, 120)

    def test_normalise_recomputes_ttm_fcf_and_applies_split_ratio(self):
        rows = []
        for index, end in enumerate(("2025-12-31", "2026-03-31", "2026-06-30", "2026-09-30"), start=1):
            rows.extend([
                obs("revenue", index * 10, end, "2026-10-01", start=end),
                obs("ocf", index * 6, end, "2026-10-01", start=end),
                obs("capex", index * 2, end, "2026-10-01", start=end),
            ])
        rows.extend([
            obs("sharesDiluted", 10, "2026-09-30", "2026-10-01", period_type="instant", unit="shares"),
            obs("cash", 80, "2026-09-30", "2026-10-01", period_type="instant"),
            obs("debt", 20, "2026-09-30", "2026-10-01", period_type="instant"),
            obs("price", 10, "2026-10-28", "2026-10-28", period_type="instant"),
            obs("marketCap", 500, "2026-10-28", "2026-10-28", period_type="instant"),
        ])
        result = normalise(
            InputSnapshot(tuple(rows), (CorporateAction("TEST", "split", "2026-10-01", 5.0),)),
            "2026-10-28",
        )
        self.assertEqual(result.revenue_ttm, 100)
        self.assertEqual(result.ocf_ttm, 60)
        self.assertEqual(result.capex_ttm, 20)
        self.assertEqual(result.fcf_ttm, 40)
        self.assertEqual(result.shares_diluted, 50)
        self.assertEqual(result.net_cash, 60)
        self.assertEqual(result.split_check, "adjusted")

    def test_disputed_or_currency_conflicting_inputs_lower_quality(self):
        rows = [
            obs("revenue", 100, "2026-09-30", "2026-10-01", status="disputed"),
            obs("price", 10, "2026-10-28", "2026-10-28", period_type="instant", currency="USD"),
            obs("marketCap", 100, "2026-10-28", "2026-10-28", period_type="instant", currency="EUR"),
        ]
        result = normalise(InputSnapshot(tuple(rows)), "2026-10-28")
        self.assertLess(result.data_quality, 100)
        self.assertTrue(any("disputed" in flag.lower() for flag in result.flags))
        self.assertTrue(any("currency" in flag.lower() for flag in result.flags))

    def test_quarter_ttm_requires_contiguous_periods_and_matching_units(self):
        rows = [
            obs("revenue", 100, "2025-12-31", "2026-01-15", unit="USD", currency="USD"),
            obs("revenue", 100, "2026-03-31", "2026-04-15", unit="USD", currency="USD"),
            obs("revenue", 100, "2026-09-30", "2026-10-15", unit="EUR", currency="EUR"),
            obs("revenue", 100, "2026-12-31", "2027-01-15", unit="USD", currency="USD"),
        ]
        result = normalise(InputSnapshot(tuple(rows)), "2027-02-01")
        self.assertIsNone(result.revenue_ttm)
        self.assertTrue(any("comparable" in flag.lower() or "currency" in flag.lower() for flag in result.flags))

    def test_post_split_shares_are_not_adjusted_by_older_actions(self):
        rows = [obs("sharesDiluted", 50, "2026-09-30", "2026-10-01", period_type="instant", unit="shares")]
        result = normalise(InputSnapshot(tuple(rows), (CorporateAction("TEST", "split", "2026-08-01", 5.0),)), "2026-10-28")
        self.assertEqual(result.shares_diluted, 50)
        self.assertEqual(result.split_check, "not-assessed")


if __name__ == "__main__":
    unittest.main()

