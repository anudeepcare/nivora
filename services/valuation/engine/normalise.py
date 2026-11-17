"""Point-in-time normalization and reconciliation for valuation inputs."""

from __future__ import annotations

from dataclasses import dataclass, field
from math import isfinite
from datetime import date
from typing import Sequence


@dataclass(frozen=True)
class Observation:
    symbol: str
    metric: str
    period_end: str
    period_type: str
    value: float
    unit: str
    currency: str | None
    source: str
    source_ref: str | None
    filed_at: str
    start: str | None = None
    status: str = "clean"
    basis: str | None = None


@dataclass(frozen=True)
class CorporateAction:
    symbol: str
    action_type: str
    effective_date: str
    ratio: float


@dataclass(frozen=True)
class InputSnapshot:
    observations: tuple[Observation, ...]
    corporate_actions: tuple[CorporateAction, ...] = ()
    as_of: str = ""
    metadata: dict[str, object] = field(default_factory=dict)


@dataclass(frozen=True)
class NormalisedInputs:
    symbol: str
    as_of: str
    revenue_ttm: float | None
    ocf_ttm: float | None
    capex_ttm: float | None
    fcf_ttm: float | None
    shares_diluted: float | None
    price: float | None
    market_cap: float | None
    currency: str | None
    net_cash: float | None
    dilution_3y: float | None
    data_quality: float
    flags: tuple[str, ...]
    lineage: tuple[dict[str, str], ...]
    split_check: str
    disputed: bool
    cash: float | None = None
    debt: float | None = None
    metadata: dict[str, object] = field(default_factory=dict)
    ebit_ttm: float | None = None
    ebitda_ttm: float | None = None
    interest_expense_ttm: float | None = None
    book_equity: float | None = None
    roe: float | None = None
    affo: float | None = None
    nav: float | None = None
    depreciation_ttm: float | None = None
    revenue_growth_yoy: float | None = None
    growth: float | None = None
    currency_conflict: bool = False


def read_as_of(
    observations: Sequence[Observation],
    symbol: str,
    metric: str,
    period_type: str,
    as_of: str,
) -> Observation | None:
    eligible = [
        row
        for row in observations
        if row.symbol == symbol
        and row.metric == metric
        and row.period_type == period_type
        and row.filed_at[:10] <= as_of[:10]
        and row.period_end[:10] <= as_of[:10]
    ]
    return max(eligible, key=lambda row: (row.period_end, row.filed_at)) if eligible else None


def _latest_period_rows(
    observations: Sequence[Observation], symbol: str, metric: str, period_type: str, as_of: str
) -> list[Observation]:
    visible = [
        row
        for row in observations
        if row.symbol == symbol
        and row.metric == metric
        and row.period_type == period_type
        and row.filed_at[:10] <= as_of[:10]
        and row.period_end[:10] <= as_of[:10]
    ]
    by_period: dict[str, Observation] = {}
    for row in visible:
        previous = by_period.get(row.period_end)
        if previous is None or row.filed_at > previous.filed_at:
            by_period[row.period_end] = row
    return sorted(by_period.values(), key=lambda row: row.period_end, reverse=True)


def _value(rows: Sequence[Observation], metric: str, period_type: str = "instant") -> Observation | None:
    eligible = [row for row in rows if row.metric == metric and row.period_type == period_type and row.status == "clean"]
    return max(eligible, key=lambda row: (row.period_end, row.filed_at)) if eligible else None


def _sum_quarters(observations: Sequence[Observation], symbol: str, metric: str, as_of: str) -> tuple[float | None, list[Observation]]:
    rows = _latest_period_rows(observations, symbol, metric, "Q", as_of)[:4]
    if len(rows) != 4 or not all(isfinite(row.value) and row.status == "clean" for row in rows):
        return None, rows
    try:
        quarters = [(date.fromisoformat(row.period_end[:10]).year * 4 + (date.fromisoformat(row.period_end[:10]).month - 1) // 3) for row in rows]
    except ValueError:
        return None, rows
    if any(left - right != 1 for left, right in zip(quarters, quarters[1:])):
        return None, rows
    identity = {(row.currency, row.unit, row.basis) for row in rows}
    if len(identity) != 1:
        return None, rows
    return sum(row.value for row in rows), rows


def normalise(snapshot: InputSnapshot, as_of: str) -> NormalisedInputs:
    """Build a reconciled point-in-time snapshot without network or clock access."""
    if not snapshot.observations:
        return NormalisedInputs(
            symbol="",
            as_of=as_of,
            revenue_ttm=None,
            ocf_ttm=None,
            capex_ttm=None,
            fcf_ttm=None,
            shares_diluted=None,
            price=None,
            market_cap=None,
            currency=None,
            net_cash=None,
            dilution_3y=None,
            data_quality=0.0,
            flags=("No point-in-time observations were supplied.",),
            lineage=(),
            split_check="not-assessed",
            disputed=False,
            cash=None,
            debt=None,
            metadata=dict(snapshot.metadata),
        )

    symbol = snapshot.observations[0].symbol
    flags: list[str] = []
    lineage: list[dict[str, str]] = []
    quality = 100.0
    visible = [row for row in snapshot.observations if row.filed_at[:10] <= as_of[:10] and row.period_end[:10] <= as_of[:10]]
    disputed = any(row.status == "disputed" for row in visible)
    blocked = any(row.status == "blocked" for row in visible)
    if disputed:
        quality -= 15
        flags.append("One or more point-in-time inputs are disputed.")
    if blocked:
        quality -= 40
        flags.append("One or more point-in-time inputs are blocked.")

    revenue_ttm, revenue_rows = _sum_quarters(snapshot.observations, symbol, "revenue", as_of)
    ocf_ttm, ocf_rows = _sum_quarters(snapshot.observations, symbol, "ocf", as_of)
    capex_ttm, capex_rows = _sum_quarters(snapshot.observations, symbol, "capex", as_of)
    ebit_ttm, _ = _sum_quarters(snapshot.observations, symbol, "ebit", as_of)
    ebitda_ttm, _ = _sum_quarters(snapshot.observations, symbol, "ebitda", as_of)
    interest_expense_ttm, _ = _sum_quarters(snapshot.observations, symbol, "interestExpense", as_of)
    depreciation_ttm, _ = _sum_quarters(snapshot.observations, symbol, "depreciation", as_of)
    revenue_history = _latest_period_rows(snapshot.observations, symbol, "revenue", "Q", as_of)
    revenue_growth_yoy = None
    if len(revenue_history) >= 5 and revenue_history[4].value > 0 and revenue_history[0].currency == revenue_history[4].currency and revenue_history[0].unit == revenue_history[4].unit:
        revenue_growth_yoy = (revenue_history[0].value / revenue_history[4].value - 1.0) * 100.0
    for metric, rows in (("revenue", revenue_rows), ("ocf", ocf_rows), ("capex", capex_rows)):
        for row in rows:
            lineage.append({"metric": metric, "periodEnd": row.period_end, "source": row.source, "sourceRef": row.source_ref or ""})
    if revenue_ttm is None:
        flags.append("Four comparable revenue quarters are unavailable.")
        quality -= 15
    if ocf_ttm is None or capex_ttm is None:
        flags.append("Four comparable cash-flow quarters are unavailable.")
        quality -= 15

    latest = [row for row in visible if row.symbol == symbol]
    shares_row = _value(latest, "sharesDiluted")
    price_row = _value(latest, "price")
    market_cap_row = _value(latest, "marketCap")
    cash_row = _value(latest, "cash")
    debt_row = _value(latest, "debt")
    book_equity_row = _value(latest, "bookEquity")
    affo_row = _value(latest, "affo")
    nav_row = _value(latest, "nav")
    shares = shares_row.value if shares_row else None
    price = price_row.value if price_row else None
    market_cap = market_cap_row.value if market_cap_row else None
    split_ratio = 1.0
    share_period = shares_row.period_end[:10] if shares_row else as_of[:10]
    for action in sorted(snapshot.corporate_actions, key=lambda item: item.effective_date):
        if action.symbol == symbol and action.action_type in {"split", "reverse_split"} and share_period < action.effective_date <= as_of[:10] and action.ratio > 0:
            split_ratio *= action.ratio
    split_check = "not-assessed"
    if shares is not None and split_ratio != 1.0:
        shares *= split_ratio
        split_check = "adjusted"
    if shares is not None and price is not None and market_cap is not None and market_cap > 0:
        observed_cap = price * shares
        if abs(observed_cap / market_cap - 1) <= 0.10:
            split_check = "matched" if split_check == "not-assessed" else split_check
        else:
            split_check = "failed"
            quality -= 30
            flags.append("Price, shares and market capitalization do not reconcile within 10%.")
    if shares is None or shares <= 0:
        quality -= 40
        flags.append("A positive diluted share count is unavailable.")

    currencies = {row.currency for row in (price_row, market_cap_row) if row and row.currency}
    currency = price_row.currency if price_row else (next(iter(currencies)) if currencies else None)
    financial_currencies = {row.currency for row in visible if row.metric in {"revenue", "ocf", "capex", "ebit", "ebitda", "interestExpense", "depreciation", "cash", "debt", "bookEquity", "affo", "nav"} and row.currency}
    currency_conflict = bool(currency and financial_currencies and any(code != currency for code in financial_currencies))
    if len(currencies) > 1:
        quality -= 10
        flags.append("Price and market-cap currency values do not match.")
    if currency_conflict:
        quality -= 20
        flags.append("Financial statement currency differs from the quoted price currency; FX conversion is required.")
    if price_row:
        try:
            price_age = (date.fromisoformat(as_of[:10]) - date.fromisoformat(price_row.period_end[:10])).days
            if price_age > 7:
                quality -= 35
                flags.append("The latest eligible price is stale for this as-of date.")
        except ValueError:
            quality -= 35
            flags.append("The latest eligible price date is invalid.")

    cash = cash_row.value if cash_row and cash_row.value >= 0 else None
    debt = debt_row.value if debt_row and debt_row.value >= 0 else None
    net_cash = cash - debt if cash is not None and debt is not None else None
    fcf_ttm = ocf_ttm - capex_ttm if ocf_ttm is not None and capex_ttm is not None else None

    annual_shares = _latest_period_rows(snapshot.observations, symbol, "sharesDiluted", "FY", as_of)
    dilution_3y = None
    if len(annual_shares) >= 2 and annual_shares[0].value > 0 and annual_shares[-1].value > 0:
        years = max(1.0, (int(annual_shares[0].period_end[:4]) - int(annual_shares[-1].period_end[:4])))
        dilution_3y = ((annual_shares[0].value / annual_shares[-1].value) ** (1 / years) - 1) * 100

    return NormalisedInputs(
        symbol=symbol,
        as_of=as_of,
        revenue_ttm=revenue_ttm,
        ocf_ttm=ocf_ttm,
        capex_ttm=capex_ttm,
        fcf_ttm=fcf_ttm,
        shares_diluted=shares,
        price=price,
        market_cap=market_cap,
        currency=currency,
        net_cash=net_cash,
        dilution_3y=dilution_3y,
        data_quality=max(0.0, min(100.0, quality)),
        flags=tuple(flags),
        lineage=tuple(lineage),
        split_check=split_check,
        disputed=disputed,
        cash=cash,
        debt=debt,
        metadata=dict(snapshot.metadata),
        ebit_ttm=ebit_ttm,
        ebitda_ttm=ebitda_ttm,
        interest_expense_ttm=interest_expense_ttm,
        book_equity=book_equity_row.value if book_equity_row else None,
        roe=float(snapshot.metadata["roe"]) if isinstance(snapshot.metadata.get("roe"), (int, float)) else None,
        affo=affo_row.value if affo_row else None,
        nav=nav_row.value if nav_row else None,
        depreciation_ttm=depreciation_ttm,
        revenue_growth_yoy=revenue_growth_yoy,
        growth=revenue_growth_yoy / 100.0 if revenue_growth_yoy is not None else None,
        currency_conflict=currency_conflict,
    )

