"""Guarded multi-stage cash-flow valuation."""

from __future__ import annotations

from typing import Any

from ..rates import RateInputs
from ..route import Route
from .common import currency, finite, get, make_result, shares


def dcf_value(inputs: Any, rates: RateInputs, growth: float | None = None, terminal_growth: float | None = None) -> float | None:
    fcf = finite(get(inputs, "fcf"))
    if fcf is None:
        fcf = finite(get(inputs, "fcf_ttm"))
    if fcf is None:
        fcf = finite(get(inputs, "fcf_after_sbc"))
    if fcf is None or fcf <= 0:
        return None
    supplied_growth = finite(get(inputs, "growth"))
    g = (0.08 if supplied_growth is None else supplied_growth) if growth is None else growth
    tg = rates.terminal_growth if terminal_growth is None else terminal_growth
    g = max(-0.50, min(g, 0.50))
    tg = max(-0.02, min(tg, 0.08))
    wacc = max(rates.wacc, tg + 0.03)
    cash = max(finite(get(inputs, "cash", get(inputs, "liquid_assets", 0.0)), 0.0) or 0.0, 0.0)
    debt = max(finite(get(inputs, "debt", get(inputs, "financial_debt", 0.0)), 0.0) or 0.0, 0.0)
    pv = 0.0
    flow = fcf
    for year in range(1, 6):
        flow *= 1.0 + g
        rate = rates.discount_rates.get(year, wacc)
        pv += flow / ((1.0 + max(rate, 0.0)) ** year)
    terminal = flow * (1.0 + tg) / (wacc - tg)
    pv += terminal / ((1.0 + wacc) ** 5)
    return max((pv + cash - debt) / shares(inputs), 0.0)


def run(route: Route, inputs: Any, rates: RateInputs):
    model_inputs = dict(vars(inputs)) if hasattr(inputs, "__dict__") else dict(inputs)
    method_name = "multi-stage-dcf"
    flags: tuple[str, ...] = ()
    if route.family == "build-out":
        capex = finite(get(inputs, "capex_ttm", get(inputs, "capex")))
        depreciation = finite(get(inputs, "depreciation_ttm", get(inputs, "depreciation")))
        if capex is not None and depreciation is not None and capex > depreciation:
            model_inputs["fcf"] = (finite(get(inputs, "fcf", get(inputs, "fcf_ttm", get(inputs, "fcf_after_sbc"))), 0.0) or 0.0) - (capex - depreciation) * 0.5
            method_name = "build-out-capex-normalized"
            flags = ("capex-normalized",)
    base = dcf_value(model_inputs, rates)
    if base is None:
        return make_result(status="unavailable", method=method_name, base=None, currency=currency(inputs), flags=flags + ("non-positive-fcf",))
    supplied_growth = finite(get(inputs, "growth"))
    growth = 0.08 if supplied_growth is None else supplied_growth
    assumptions = {"growth": growth, "terminal_growth": rates.terminal_growth, "wacc": rates.wacc, "horizon_years": 5.0}
    assumptions.update({
        "bear_growth": max(-0.50, min(growth - 0.08, 0.50)),
        "bear_terminal_growth": max(-0.02, min(rates.terminal_growth - 0.01, 0.08)),
        "bull_growth": max(-0.50, min(growth + 0.08, 0.50)),
        "bull_terminal_growth": max(-0.02, min(rates.terminal_growth + 0.005, 0.08)),
        "fcf_used": finite(get(model_inputs, "fcf")),
    })
    return make_result(
        status="supported",
        method=method_name,
        base=base,
        bear=dcf_value(model_inputs, rates, growth - 0.08, rates.terminal_growth - 0.01),
        bull=dcf_value(model_inputs, rates, growth + 0.08, rates.terminal_growth + 0.005),
        currency=currency(inputs),
        confidence=max(0.0, min(100.0, 72.0 - rates.confidence_penalty)),
        flags=flags,
        assumptions=assumptions,
    )

