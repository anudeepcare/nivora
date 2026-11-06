"""Ordered evidence-based valuation-family routing."""

from __future__ import annotations

from dataclasses import dataclass, field

from .config import CYCLICAL_SECTORS


@dataclass(frozen=True)
class RouteInput:
    asset_type: str = "stock"
    sector: str | None = None
    industry: str | None = None
    market_cap: float | None = None
    price: float | None = None
    revenue_ttm: float | None = None
    revenue_growth_yoy: float | None = None
    fcf_after_sbc: float | None = None
    ebit_ttm: float | None = None
    ebitda_ttm: float | None = None
    interest_expense: float | None = None
    interest_coverage: float | None = None
    financial_debt: float | None = None
    net_interest_income: float | None = None
    capex_ttm: float | None = None
    depreciation_ttm: float | None = None
    ocf_ttm: float | None = None
    margin_volatility: float | None = None
    average_dollar_volume: float | None = None
    data_quality: float = 100.0
    otc: bool = False
    bank: bool = False
    insurer: bool = False
    reit: bool = False
    going_concern: bool = False
    beta: float | None = None
    peer_unlevered_beta: float | None = None
    tax_rate: float = 0.21
    serial_issuer: bool = False
    shares_growth_1y: float | None = None
    liquid_assets: float | None = None


@dataclass(frozen=True)
class Route:
    family: str
    rule: int
    fit: float
    flags: tuple[str, ...] = field(default_factory=tuple)


def _coverage(item: RouteInput) -> float | None:
    if item.interest_coverage is not None:
        return item.interest_coverage
    if item.ebit_ttm is not None and item.interest_expense and item.interest_expense > 0:
        return item.ebit_ttm / item.interest_expense
    return None


def route_company(normalised: RouteInput) -> Route:
    """Route by ordered business evidence; ticker names never affect the result."""
    flags: list[str] = []
    if normalised.market_cap is not None and normalised.market_cap < 300_000_000:
        flags.append("small-cap")
    if normalised.average_dollar_volume is not None and normalised.average_dollar_volume < 1_000_000:
        flags.append("low-liquidity")
    if normalised.shares_growth_1y is not None and normalised.shares_growth_1y > 20:
        flags.append("serial-dilution-risk")
    if normalised.asset_type.lower() in {"fund", "etf", "closed-end-fund"}:
        return Route("fund", 1, 0, tuple(flags))
    if normalised.asset_type.lower() in {"crypto", "commodity"}:
        return Route("crypto", 2, 0, tuple(flags))
    if normalised.otc and (normalised.average_dollar_volume is None or normalised.average_dollar_volume < 100_000):
        return Route("untradeable", 3, 0, tuple(flags + ["illiquid-otc"]))
    revenue = normalised.revenue_ttm or 0.0
    growth = normalised.revenue_growth_yoy or 0.0
    if normalised.bank or (normalised.net_interest_income is not None and revenue > 0 and normalised.net_interest_income / revenue > 0.5):
        return Route("bank", 4, 100, tuple(flags))
    if normalised.insurer:
        return Route("insurer", 5, 100, tuple(flags))
    if normalised.reit:
        return Route("reit", 6, 100, tuple(flags))
    if revenue < 10_000_000 or (normalised.market_cap and revenue < 0.05 * normalised.market_cap and (normalised.ebit_ttm or 0) < 0):
        return Route("shell", 7, 0, tuple(flags + ["no-operating-revenue"]))
    coverage = _coverage(normalised)
    if normalised.going_concern or (
        coverage is not None
        and coverage < 1
        and (normalised.financial_debt or 0) > 3 * max(normalised.ebitda_ttm or 0, 1)
    ):
        return Route("distressed", 8, 50, tuple(flags + ["distress-gate"]))
    if (normalised.fcf_after_sbc or 0) < 0 and growth >= 15:
        return Route("funded-growth", 9, 70, tuple(flags))
    if (normalised.fcf_after_sbc or 0) < 0:
        return Route("mature-loss-maker", 10, 50, tuple(flags))
    if (normalised.sector or "").lower() in CYCLICAL_SECTORS or (normalised.margin_volatility or 0) > 8:
        return Route("cyclical", 11, 100, tuple(flags))
    if (
        normalised.capex_ttm is not None
        and normalised.depreciation_ttm is not None
        and normalised.depreciation_ttm > 0
        and normalised.capex_ttm > 2 * normalised.depreciation_ttm
        and revenue > 0
        and normalised.capex_ttm / revenue > 0.15
        and (normalised.ocf_ttm or 0) > 0
    ):
        return Route("build-out", 12, 100, tuple(flags + ["capex-normalized"]))
    if (normalised.fcf_after_sbc or 0) > 0 and growth >= 10:
        return Route("profitable-growth", 13, 100, tuple(flags))
    return Route("mature", 14, 100, tuple(flags))

