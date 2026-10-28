"""Duration-aware cost-of-capital construction with explicit fallbacks."""

from __future__ import annotations

from dataclasses import dataclass

from .config import ERP_DEFAULT, MIN_TERMINAL_SPREAD, TAX_DEFAULT, TERMINAL_GROWTH_CAP, TERMINAL_GROWTH_FLOOR, debt_spread, size_premium
from .route import RouteInput


@dataclass(frozen=True)
class YieldCurve:
    points: dict[int, float]

    def rate_for(self, years: int) -> float:
        if not self.points:
            return 4.0
        keys = sorted(self.points)
        if years <= keys[0]:
            return self.points[keys[0]]
        if years >= keys[-1]:
            return self.points[keys[-1]]
        for left, right in zip(keys, keys[1:]):
            if left <= years <= right:
                ratio = (years - left) / (right - left)
                return self.points[left] + (self.points[right] - self.points[left]) * ratio
        return self.points[keys[-1]]


@dataclass(frozen=True)
class RateInputs:
    discount_rates: dict[int, float]
    beta_adj: float
    erp: float
    size_premium: float
    distress_premium: float
    cost_of_equity: float
    cost_of_debt: float
    wacc: float
    terminal_growth: float
    flags: tuple[str, ...] = ()
    confidence_penalty: float = 0.0


def build_rates(normalised: RouteInput, curve: YieldCurve) -> RateInputs:
    flags: list[str] = []
    penalty = 0.0
    tax = normalised.tax_rate if 0.10 <= normalised.tax_rate <= 0.30 else TAX_DEFAULT
    if normalised.beta is None:
        raw_beta = 1.1
        flags.append("Beta unavailable; default beta used.")
    else:
        raw_beta = normalised.beta
    if normalised.peer_unlevered_beta is not None and normalised.market_cap and normalised.market_cap > 0:
        debt_equity = (normalised.financial_debt or 0) / normalised.market_cap
        raw_beta = normalised.peer_unlevered_beta * (1 + (1 - tax) * debt_equity)
    beta_adj = min(2.5, max(0.6, 0.67 * raw_beta + 0.33))
    coverage = normalised.interest_coverage
    # Vendor/yield-curve inputs are percentage points; the engine contract uses decimals.
    distress = (4.0 if coverage is not None and coverage < 1 else 2.0 if coverage is not None and coverage < 1.5 else 0.0) / 100.0
    size = size_premium(normalised.market_cap) / 100.0
    rf10 = curve.rate_for(10) / 100.0
    erp = ERP_DEFAULT / 100.0
    ke_unclamped = rf10 + beta_adj * erp + size + distress
    upper = (16.0 if (normalised.market_cap or 0) > 2_000_000_000 else 25.0) / 100.0
    cost_of_equity = min(upper, max(rf10 + 0.03, ke_unclamped))
    spread = debt_spread(coverage) / 100.0
    cost_of_debt = curve.rate_for(5) / 100.0 + spread
    equity = max(normalised.market_cap or 0.0, 0.0)
    debt = max(normalised.financial_debt or 0.0, 0.0)
    total = equity + debt
    wacc = cost_of_equity if total == 0 else (equity / total) * cost_of_equity + (debt / total) * cost_of_debt * (1 - tax)
    terminal_growth = min(TERMINAL_GROWTH_CAP / 100.0, max(TERMINAL_GROWTH_FLOOR / 100.0, rf10 - 0.015))
    if wacc - terminal_growth < MIN_TERMINAL_SPREAD / 100.0:
        wacc = terminal_growth + MIN_TERMINAL_SPREAD / 100.0
        penalty += 10.0
        flags.append("Terminal spread widened to the minimum 3 percentage points.")
    equity_spread = cost_of_equity - rf10
    # Discount-rate outputs are consumed by valuation methods as decimals.
    discount_rates = {year: curve.rate_for(year) / 100.0 + equity_spread for year in range(1, 11)}
    return RateInputs(
        discount_rates=discount_rates,
        beta_adj=beta_adj,
        erp=erp,
        size_premium=size,
        distress_premium=distress,
        cost_of_equity=cost_of_equity,
        cost_of_debt=cost_of_debt,
        wacc=wacc,
        terminal_growth=terminal_growth,
        flags=tuple(flags),
        confidence_penalty=penalty,
    )

