"""Funding-aware expansion model; no value when the plan cannot be funded."""

from __future__ import annotations

from typing import Any

from ..rates import RateInputs
from ..route import Route
from .common import currency, finite, get, make_result, shares
from .dcf import dcf_value


def run(route: Route, inputs: Any, rates: RateInputs):
    fcf = finite(get(inputs, "fcf"))
    if fcf is None:
        fcf = finite(get(inputs, "fcf_ttm"))
    if fcf is None:
        fcf = finite(get(inputs, "fcf_after_sbc"))
    fcf = fcf or 0.0
    cash = max(finite(get(inputs, "cash", get(inputs, "liquid_assets", 0.0)), 0.0) or 0.0, 0.0)
    debt = max(finite(get(inputs, "debt", get(inputs, "financial_debt", 0.0)), 0.0) or 0.0, 0.0)
    growth = finite(get(inputs, "growth", 0.0), 0.0) or 0.0
    funding_gap = max(0.0, (-fcf * 3.0) - cash)
    financing_capacity = max(finite(get(inputs, "financing_capacity"), 0.0) or 0.0, 0.0)
    if funding_gap > 0 and (financing_capacity < funding_gap or debt > cash * 4.0):
        return make_result(status="partial", method="funded-growth", base=None, currency=currency(inputs), confidence=25.0, flags=("funding-gap", "dilution-or-debt-risk"), assumptions={"funding_gap": funding_gap})
    if fcf < 0:
        revenue = finite(get(inputs, "revenue", get(inputs, "revenue_ttm")))
        margin = finite(get(inputs, "margin"))
        if revenue is None or revenue <= 0 or margin is None or margin <= 0:
            return make_result(status="partial", method="funded-growth", base=None, currency=currency(inputs), confidence=25.0, flags=("missing-operating-path",), assumptions={"funding_gap": funding_gap})
        growth = max(0.0, min(growth, 0.45))
        target_fcf = revenue * ((1.0 + growth) ** 3) * margin
        pv = 0.0
        cash_balance = cash
        funding_used = 0.0
        transition_flows: list[float] = []
        for year in range(1, 4):
            flow = fcf + (target_fcf - fcf) * (year / 3.0)
            transition_flows.append(flow)
            if flow < 0:
                need = -flow
                from_cash = min(cash_balance, need)
                cash_balance -= from_cash
                need -= from_cash
                if need > 0:
                    from_financing = min(max(0.0, financing_capacity - funding_used), need)
                    funding_used += from_financing
                    need -= from_financing
                if need > 1e-9:
                    return make_result(status="partial", method="funded-growth", base=None, currency=currency(inputs), confidence=25.0, flags=("transition-unfunded",), assumptions={"funding_gap": funding_gap, "transition_years": 3.0})
            else:
                cash_balance += flow
            rate = rates.discount_rates.get(year, rates.wacc)
            pv += flow / ((1.0 + max(rate, 0.0)) ** year)
        terminal_growth = rates.terminal_growth
        terminal = target_fcf * (1.0 + terminal_growth) / (rates.wacc - terminal_growth)
        pv += terminal / ((1.0 + rates.wacc) ** 3)
        equity_value = pv + cash_balance - debt - funding_used
        base = max(equity_value / shares(inputs), 0.0)
        assumptions = {"funding_gap": funding_gap, "growth": growth, "margin": margin, "transition_years": 3.0, "target_fcf": target_fcf, "funding_used": funding_used}
        flags = ("funding-reviewed", "explicit-operating-path", "transition-cash-flow")
    else:
        synthetic = dict(inputs) if isinstance(inputs, dict) else {"fcf": fcf, "cash": cash, "debt": debt, "shares_outstanding": shares(inputs), "growth": growth}
        synthetic["fcf"] = fcf
        base = dcf_value(synthetic, rates, max(0.0, min(growth, 0.45)))
        assumptions = {"funding_gap": funding_gap, "growth": growth}
        flags = ("funding-reviewed",)
    if base is None or base <= 0:
        return make_result(status="partial", method="funded-growth", base=None, currency=currency(inputs), confidence=30.0, flags=("insufficient-funding-evidence",))
    return make_result(status="supported", method="funded-growth", base=base, bear=base * 0.55, bull=base * 1.55, currency=currency(inputs), confidence=55.0 - rates.confidence_penalty, flags=flags, assumptions=assumptions)

