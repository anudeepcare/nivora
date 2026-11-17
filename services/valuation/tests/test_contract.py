import math
import unittest

from services.valuation.api import handle_valuation_request
from services.valuation.engine.types import value_stock, ValuationInputs


class ContractTests(unittest.TestCase):
    def test_value_stock_is_deterministic_and_refuses_unimplemented_snapshot(self):
        result = value_stock(ValuationInputs(symbol="AAPL", as_of="2026-10-28"))
        self.assertEqual(result["symbol"], "AAPL")
        self.assertEqual(result["status"], "refused")
        self.assertTrue(result["traceId"])
        self.assertEqual(result, value_stock(ValuationInputs(symbol="AAPL", as_of="2026-10-28")))

    def test_contract_has_no_non_finite_numbers(self):
        result = value_stock(ValuationInputs(symbol="MSFT", as_of="2026-10-28"))

        def walk(value):
            if isinstance(value, dict):
                for nested in value.values():
                    yield from walk(nested)
            elif isinstance(value, list):
                for nested in value:
                    yield from walk(nested)
            elif isinstance(value, (int, float)) and not isinstance(value, bool):
                yield value

        self.assertTrue(all(math.isfinite(number) for number in walk(result)))

    def test_api_rejects_malformed_symbol_and_accepts_valid_snapshot(self):
        bad_status, _ = handle_valuation_request(
            "POST", "/v1/valuation", {"symbol": "not valid", "asOf": "2026-10-28"}
        )
        self.assertEqual(bad_status, 422)
        good_status, body = handle_valuation_request(
            "POST", "/v1/valuation", {"symbol": "MSFT", "asOf": "2026-10-28"}
        )
        self.assertEqual(good_status, 200)
        self.assertEqual(body["symbol"], "MSFT")

    def test_api_accepts_a_bounded_supplied_snapshot_without_network_work(self):
        observations = []
        for end in ("2025-12-31", "2026-03-31", "2026-06-30", "2026-09-30"):
            for metric, value in (("revenue", 1000), ("ocf", 300), ("capex", 100)):
                observations.append({"symbol": "MSFT", "metric": metric, "periodEnd": end, "periodType": "Q", "value": value, "unit": "USD", "currency": "USD", "source": "fixture", "filedAt": "2026-10-01"})
        observations += [{"symbol": "MSFT", "metric": "sharesDiluted", "periodEnd": "2026-09-30", "periodType": "instant", "value": 100, "unit": "shares", "currency": "USD", "source": "fixture", "filedAt": "2026-10-01"}, {"symbol": "MSFT", "metric": "price", "periodEnd": "2026-10-28", "periodType": "instant", "value": 100, "unit": "USD", "currency": "USD", "source": "fixture", "filedAt": "2026-10-28"}]
        status, body = handle_valuation_request("POST", "/v1/valuation", {"symbol": "MSFT", "asOf": "2026-10-28", "snapshot": {"observations": observations, "metadata": {"assetType": "stock"}}})
        self.assertEqual(status, 200)
        self.assertEqual(body["symbol"], "MSFT")
        self.assertIn(body["status"], {"ok", "low-confidence", "range-only", "refused"})

    def test_api_rejects_nonfinite_or_cross_symbol_snapshot_rows(self):
        payload = {"symbol": "MSFT", "asOf": "2026-10-28", "snapshot": {"observations": [{"symbol": "AAPL", "metric": "price", "periodEnd": "2026-10-28", "periodType": "instant", "value": "nan", "filedAt": "2026-10-28"}]}}
        status, _ = handle_valuation_request("POST", "/v1/valuation", payload)
        self.assertEqual(status, 422)

    def test_api_rejects_malformed_metadata_before_engine_evaluation(self):
        payload = {
            "symbol": "MSFT",
            "asOf": "2026-10-28",
            "snapshot": {"observations": [], "metadata": {"yieldCurve": {"oops": "bad"}}},
        }
        status, _ = handle_valuation_request("POST", "/v1/valuation", payload)
        self.assertEqual(status, 422)



if __name__ == "__main__":
    unittest.main()

