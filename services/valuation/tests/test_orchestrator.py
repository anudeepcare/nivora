import unittest

from services.valuation.engine.index import value_stock
from services.valuation.engine.normalise import InputSnapshot, Observation


def obs(symbol, metric, end, value, period="Q", currency="USD"):
    return Observation(symbol, metric, end, period, value, "reported", currency, "fixture", f"fixture:{metric}:{end}", f"{end}T12:00:00Z")


class OrchestratorTests(unittest.TestCase):
    def test_snapshot_is_reconciled_and_returns_versioned_output(self):
        symbol = "TEST"
        rows = []
        for end in ("2025-12-31", "2026-03-31", "2026-06-30", "2026-09-30"):
            rows.extend([obs(symbol, "revenue", end, 100_000_000), obs(symbol, "ocf", end, 30_000_000), obs(symbol, "capex", end, 10_000_000)])
        rows += [obs(symbol, "sharesDiluted", "2026-09-30", 100, "instant"), obs(symbol, "price", "2026-09-30", 80, "instant"), obs(symbol, "cash", "2026-09-30", 500, "instant"), obs(symbol, "debt", "2026-09-30", 100, "instant")]
        result = value_stock(InputSnapshot(tuple(rows), as_of="2026-10-28", metadata={"assetType": "stock", "sector": "software"}))
        self.assertEqual(result["symbol"], symbol)
        self.assertIn(result["status"], {"ok", "low-confidence", "range-only", "refused"})
        self.assertTrue(result["traceId"].startswith("valuation-"))
        self.assertEqual(result["modelVersion"], "valuation@1.0.0")
        self.assertEqual(result["facts"]["netCash"], 400)

    def test_crypto_snapshot_is_explicitly_refused_for_corporate_valuation(self):
        rows = (obs("BTC-USD", "price", "2026-10-28", 100_000, "instant"),)
        result = value_stock(InputSnapshot(rows, as_of="2026-10-28", metadata={"assetType": "crypto"}))
        self.assertEqual(result["family"], "crypto")
        self.assertEqual(result["status"], "refused")
        self.assertIsNone(result["cases"]["base"]["value"])

    def test_disputed_or_low_quality_snapshot_cannot_become_supported(self):
        rows = tuple(obs("BAD", metric, "2026-09-30", 100, "instant") for metric in ("price", "sharesDiluted", "cash", "debt"))
        rows = rows + tuple(Observation("BAD", "revenue", end, "Q", 100, "reported", "USD", "fixture", None, f"{end}T12:00:00Z", status="disputed") for end in ("2025-12-31", "2026-03-31", "2026-06-30", "2026-09-30"))
        result = value_stock(InputSnapshot(rows, as_of="2026-10-28"))
        self.assertNotIn(result["status"], {"ok", "low-confidence"})
        self.assertIsNone(result["methods"][0]["value"])
        self.assertTrue(any("disputed" in flag.lower() or "quality" in flag.lower() for flag in result["flags"]))


if __name__ == "__main__":
    unittest.main()
