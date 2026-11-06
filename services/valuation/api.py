"""Small dependency-free REST adapter around the pure valuation engine."""

from __future__ import annotations

import re
import math
from datetime import date

from services.valuation.engine.normalise import CorporateAction, InputSnapshot, Observation
from services.valuation.engine.types import ValuationInputs, value_stock

_SYMBOL = re.compile(r"^[A-Z0-9][A-Z0-9./_-]{0,14}$")
_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _finite_number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _valid_metadata(metadata: object) -> bool:
    if not isinstance(metadata, dict):
        return False
    for key in ("roe", "revenueGrowth", "volatility", "deliveredGrowth"):
        if key in metadata and not _finite_number(metadata[key]):
            return False
    curve = metadata.get("yieldCurve")
    if curve is not None:
        if not isinstance(curve, dict) or len(curve) > 30:
            return False
        for year, rate in curve.items():
            try:
                if int(year) <= 0 or not _finite_number(rate):
                    return False
            except (TypeError, ValueError):
                return False
    capital = metadata.get("capitalStructure")
    if capital is not None:
        if not isinstance(capital, dict):
            return False
        for key in ("basicShares", "rsus", "convertibleShares"):
            if key in capital and not _finite_number(capital[key]):
                return False
        options = capital.get("options", [])
        if not isinstance(options, list) or len(options) > 1000:
            return False
        for option in options:
            if not isinstance(option, dict) or not _finite_number(option.get("quantity")) or not _finite_number(option.get("strike")):
                return False
    for key in ("bank", "insurer", "reit", "otc", "goingConcern"):
        if key in metadata and not isinstance(metadata[key], bool):
            return False
    return True


def handle_valuation_request(method: str, path: str, payload: object) -> tuple[int, dict[str, object]]:
    if method != "POST" or path != "/v1/valuation":
        return 404, {"error": "Not found."}
    if not isinstance(payload, dict):
        return 400, {"error": "A JSON object is required."}
    symbol = payload.get("symbol")
    as_of = payload.get("asOf")
    if not isinstance(symbol, str) or not _SYMBOL.fullmatch(symbol.upper()):
        return 422, {"error": "A valid symbol is required."}
    if not isinstance(as_of, str) or not _DATE.fullmatch(as_of):
        return 422, {"error": "asOf must be an ISO date."}
    supplied = payload.get("snapshot")
    if isinstance(supplied, dict):
        raw_rows = supplied.get("observations", [])
        raw_actions = supplied.get("corporateActions", [])
        if not isinstance(raw_rows, list) or len(raw_rows) > 5000 or not isinstance(raw_actions, list) or len(raw_actions) > 500:
            return 422, {"error": "snapshot exceeds the bounded input shape."}
        rows = []
        for row in raw_rows:
            if not isinstance(row, dict):
                continue
            try:
                row_symbol = str(row.get("symbol", symbol.upper())).upper()
                period_end = str(row["periodEnd"])
                filed_at = str(row["filedAt"])
                date.fromisoformat(period_end[:10]); date.fromisoformat(filed_at[:10])
                value = float(row["value"])
                if row_symbol != symbol.upper() or not _SYMBOL.fullmatch(row_symbol) or not math.isfinite(value) or str(row["periodType"]) not in {"Q", "FY", "TTM", "instant"} or str(row.get("status", "clean")) not in {"clean", "disputed", "blocked"}:
                    return 422, {"error": "snapshot contains an invalid observation."}
                rows.append(Observation(
                    symbol=row_symbol, metric=str(row["metric"]), period_end=period_end, period_type=str(row["periodType"]), value=value, unit=str(row.get("unit", "reported")), currency=row.get("currency"), source=str(row.get("source", "api")), source_ref=row.get("sourceRef"), filed_at=filed_at, start=row.get("start"), status=str(row.get("status", "clean")), basis=row.get("basis"),
                ))
            except (KeyError, TypeError, ValueError):
                return 422, {"error": "snapshot contains an invalid observation."}
        actions = []
        for row in raw_actions:
            if not isinstance(row, dict):
                continue
            try:
                action_symbol = str(row.get("symbol", symbol.upper())).upper()
                effective_date = str(row["effectiveDate"])
                ratio = float(row["ratio"])
                date.fromisoformat(effective_date[:10])
                if action_symbol != symbol.upper() or not math.isfinite(ratio) or ratio <= 0:
                    return 422, {"error": "snapshot contains an invalid corporate action."}
                actions.append(CorporateAction(action_symbol, str(row["actionType"]), effective_date, ratio))
            except (KeyError, TypeError, ValueError):
                return 422, {"error": "snapshot contains an invalid corporate action."}
        metadata = supplied.get("metadata", {})
        if not _valid_metadata(metadata):
            return 422, {"error": "snapshot metadata contains an invalid value."}
        snapshot = InputSnapshot(tuple(rows), tuple(actions), as_of, dict(metadata))
        try:
            result = value_stock(snapshot)
        except (TypeError, ValueError, OverflowError):
            return 422, {"error": "snapshot could not be evaluated."}
    else:
        result = value_stock(ValuationInputs(symbol=symbol.upper(), as_of=as_of))
    return 200, dict(result)

