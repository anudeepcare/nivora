"""Pure orchestration boundary for point-in-time valuation snapshots."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from .gates import apply_gates
from .capital_structure import CapitalStructure, OptionGrant, diluted_shares
from .methods import run_method
from .normalise import InputSnapshot, normalise
from .route import RouteInput, route_company
from .rates import YieldCurve, build_rates
from .scenarios import build_cases, reverse_growth
from .types import MODEL_VERSION, ValuationOutput


def _empty_case() -> dict[str, float | None]:
    return {"value": None, "vsPrice": None, "g0": None, "margin": None, "rate": None, "gT": None}


def _trace(symbol: str, as_of: str, method_trace: str) -> str:
    raw = f"{symbol}|{as_of}|{method_trace}".encode()
    return "valuation-" + hashlib.sha256(raw).hexdigest()[:24]


def value_snapshot(snapshot: InputSnapshot) -> ValuationOutput:
    if not snapshot.observations:
        symbol = str(snapshot.metadata.get("symbol", ""))
        as_of = snapshot.as_of
        return _refusal(symbol, as_of, "No point-in-time observations were supplied.")
    symbol = snapshot.observations[0].symbol
    as_of = snapshot.as_of or max(row.filed_at[:10] for row in snapshot.observations)
    n = normalise(snapshot, as_of)
    metadata = n.metadata
    route_input = RouteInput(
        asset_type=str(metadata.get("assetType", "stock")),
        sector=str(metadata.get("sector")) if metadata.get("sector") else None,
        industry=str(metadata.get("industry")) if metadata.get("industry") else None,
        market_cap=n.market_cap,
        price=n.price,
        revenue_ttm=n.revenue_ttm,
        fcf_after_sbc=n.fcf_ttm,
        capex_ttm=n.capex_ttm,
        ocf_ttm=n.ocf_ttm,
        depreciation_ttm=n.depreciation_ttm,
        ebit_ttm=n.ebit_ttm,
        ebitda_ttm=n.ebitda_ttm,
        interest_expense=n.interest_expense_ttm,
        interest_coverage=(n.ebit_ttm / n.interest_expense_ttm) if n.ebit_ttm is not None and n.interest_expense_ttm and n.interest_expense_ttm > 0 else None,
        revenue_growth_yoy=n.revenue_growth_yoy if n.revenue_growth_yoy is not None else (float(metadata["revenueGrowth"]) if isinstance(metadata.get("revenueGrowth"), (int, float)) else None),
        liquid_assets=n.cash,
        financial_debt=n.debt,
        data_quality=n.data_quality,
        bank=bool(metadata.get("bank", False)),
        insurer=bool(metadata.get("insurer", False)),
        reit=bool(metadata.get("reit", False)),
        otc=bool(metadata.get("otc", False)),
        going_concern=bool(metadata.get("goingConcern", False)),
        shares_growth_1y=n.dilution_3y,
    )
    route = route_company(route_input)
    curve_points = metadata.get("yieldCurve", {})
    curve = YieldCurve({int(k): float(v) for k, v in curve_points.items()}) if isinstance(curve_points, dict) and curve_points else YieldCurve({10: 4.0})
    rates = build_rates(route_input, curve)
    method_inputs: Any = n
    waterfall_flags: tuple[str, ...] = ()
    capital = metadata.get("capitalStructure")
    if isinstance(capital, dict) and n.price is not None:
        grants = tuple(OptionGrant(float(item.get("quantity", 0)), float(item.get("strike", 0)), str(item.get("kind", "option"))) for item in capital.get("options", []) if isinstance(item, dict))
        waterfall = diluted_shares(CapitalStructure(float(capital.get("basicShares", n.shares_diluted or 0)), float(capital.get("rsus", 0)), grants, float(capital["convertibleShares"]) if isinstance(capital.get("convertibleShares"), (int, float)) else None), n.price)
        method_inputs = {**n.__dict__, "shares_outstanding": waterfall.shares_diluted}
        waterfall_flags = waterfall.flags
    method = run_method(route, method_inputs, rates)
    gated = apply_gates(method, route)
    cases = build_cases(n, method, float(metadata.get("volatility", 0.25) or 0.25))
    price = n.price
    assumptions = method.assumptions

    def case(value: float | None, scenario: str) -> dict[str, float | None]:
        if value is None:
            return _empty_case()
        scenario_assumptions = getattr(cases, scenario).assumptions
        return {
            "value": value,
            "vsPrice": (value / price - 1.0) if price and price > 0 else None,
            "g0": float(scenario_assumptions["growth"]) if "growth" in scenario_assumptions else None,
            "margin": None,
            "rate": float(scenario_assumptions.get("wacc", rates.wacc)),
            "gT": float(scenario_assumptions.get("terminal_growth", rates.terminal_growth)),
        }

    critical_quality_failure = n.disputed or n.data_quality < 70 or n.shares_diluted is None or n.cash is None or n.debt is None or n.currency is None or n.split_check == "failed" or n.currency_conflict
    if gated.status == "supported" and not critical_quality_failure:
        bear, base, bull = gated.bear, gated.base, gated.bull
        status = "ok" if gated.confidence >= 50 else "low-confidence"
    else:
        bear = base = bull = None
        status = "range-only" if method.status == "partial" else "refused"
    flags = list(dict.fromkeys([*n.flags, *route.flags, *rates.flags, *waterfall_flags, *method.flags, *gated.flags, *(("critical-quality-gate",) if critical_quality_failure else ())]))
    if n.data_quality < 70:
        flags.append("low-data-quality")
    cash_per_share = n.cash / n.shares_diluted if n.cash is not None and n.shares_diluted else None
    runway = None
    if n.cash is not None and n.fcf_ttm is not None and n.fcf_ttm < 0:
        runway = n.cash / abs(n.fcf_ttm) * 12.0
    reverse_inputs = dict(method_inputs) if isinstance(method_inputs, dict) else dict(vars(method_inputs))
    if isinstance(method.assumptions.get("fcf_used"), (int, float)):
        reverse_inputs["fcf"] = method.assumptions["fcf_used"]
    implied = reverse_growth(reverse_inputs, price, rates) if price and price > 0 and not critical_quality_failure else None
    config_hash = "sha256:" + hashlib.sha256(json.dumps({"model": MODEL_VERSION, "curve": curve.points, "rates": rates.__dict__}, sort_keys=True, default=str).encode()).hexdigest()
    snapshot_digest = hashlib.sha256(json.dumps({"observations": [row.__dict__ for row in snapshot.observations], "actions": [row.__dict__ for row in snapshot.corporate_actions], "metadata": snapshot.metadata}, sort_keys=True, default=str).encode()).hexdigest()
    trace_id = _trace(symbol, as_of, method.trace_id + "|" + snapshot_digest + "|" + config_hash)
    return {
        "symbol": symbol,
        "asOf": as_of,
        "status": status,
        "family": route.family,
        "routeRule": route.rule,
        "methods": [{"id": method.method, "weight": 1.0 if method.base is not None and not critical_quality_failure else 0.0, "confidence": method.confidence if not critical_quality_failure else 0.0, "value": method.base if not critical_quality_failure else None}],
        "price": price,
        "cases": {"bear": case(bear, "bear"), "base": case(base, "base"), "bull": case(bull, "bull")},
        "impliedGrowth": implied.value if implied else None,
        "deliveredGrowth": metadata.get("deliveredGrowth") if isinstance(metadata.get("deliveredGrowth"), (int, float)) else None,
        "confidence": gated.confidence if gated.status == "supported" else method.confidence,
        "dataQuality": n.data_quality,
        "flags": flags,
        "refusalReason": None if status in {"ok", "low-confidence"} else "; ".join(flags) or "Valuation was not established.",
        "facts": {"netCash": n.net_cash, "runwayMonths": runway, "dilution3y": n.dilution_3y, "cashPerShare": cash_per_share},
        "audit": {"rf": curve.rate_for(10) / 100.0, "betaAdj": rates.beta_adj, "erp": rates.erp, "sizePremium": rates.size_premium, "wacc": rates.wacc, "tvShare": None},
        "traceId": trace_id,
        "modelVersion": MODEL_VERSION,
        "configHash": config_hash,
    }


def _refusal(symbol: str, as_of: str, reason: str) -> ValuationOutput:
    empty = _empty_case()
    return {
        "symbol": symbol,
        "asOf": as_of,
        "status": "refused",
        "family": "unavailable",
        "routeRule": 0,
        "methods": [],
        "price": None,
        "cases": {"bear": empty, "base": empty, "bull": empty},
        "impliedGrowth": None,
        "deliveredGrowth": None,
        "confidence": 0.0,
        "dataQuality": 0.0,
        "flags": [reason],
        "refusalReason": reason,
        "facts": {"netCash": None, "runwayMonths": None, "dilution3y": None, "cashPerShare": None},
        "audit": {"rf": None, "betaAdj": None, "erp": None, "sizePremium": None, "wacc": None, "tvShare": None},
        "traceId": _trace(symbol, as_of, "empty"),
        "modelVersion": MODEL_VERSION,
        "configHash": "sha256:valuation-defaults-v1",
    }


def value_stock(snapshot: InputSnapshot) -> ValuationOutput:
    return value_snapshot(snapshot)

