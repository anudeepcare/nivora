"""Deterministic portfolio concentration, correlation and tail-risk metrics."""

from __future__ import annotations

from dataclasses import dataclass, field
import math


@dataclass(frozen=True)
class PortfolioRisk:
    coverage: float
    concentration: float
    correlation: dict[str, float]
    var_95: float | None
    expected_shortfall_95: float | None
    scenario_contribution: dict[str, float]
    flags: tuple[str, ...] = field(default_factory=tuple)


def _quantile(values: list[float], q: float) -> float:
    ordered = sorted(values)
    if not ordered:
        return 0.0
    position = (len(ordered) - 1) * q
    lower, upper = int(position), min(int(position) + 1, len(ordered) - 1)
    fraction = position - lower
    return ordered[lower] + (ordered[upper] - ordered[lower]) * fraction


def _corr(left: list[float], right: list[float]) -> float:
    n = min(len(left), len(right))
    if n < 2:
        return 0.0
    x, y = left[:n], right[:n]
    mx, my = sum(x) / n, sum(y) / n
    dx, dy = [value - mx for value in x], [value - my for value in y]
    den = math.sqrt(sum(value * value for value in dx) * sum(value * value for value in dy))
    return sum(a * b for a, b in zip(dx, dy)) / den if den else 0.0


def portfolio_risk(positions, scenario_outputs) -> PortfolioRisk:
    valid = [(str(row.get("symbol")), float(row.get("value"))) for row in positions if isinstance(row.get("symbol"), str) and isinstance(row.get("value"), (int, float)) and math.isfinite(float(row.get("value"))) and float(row.get("value")) > 0]
    aggregated: dict[str, float] = {}
    for symbol, value in valid:
        aggregated[symbol] = aggregated.get(symbol, 0.0) + value
    valid = list(aggregated.items())
    total = sum(value for _, value in valid)
    if total <= 0:
        return PortfolioRisk(0.0, 0.0, {}, None, None, {}, ("No positive priced positions were supplied.",))
    weights = {symbol: value / total for symbol, value in valid}
    candidates = {symbol: scenario_outputs.get(symbol, {}) for symbol in weights if isinstance(scenario_outputs.get(symbol), dict) and isinstance(scenario_outputs.get(symbol, {}).get("returns"), list)}
    dated: dict[str, dict[str, float]] = {}
    for symbol, row in candidates.items():
        values: dict[str, float] = {}
        for point in row.get("returns", []):
            if isinstance(point, (list, tuple)) and len(point) == 2:
                day, value = str(point[0])[:10], point[1]
            elif isinstance(point, dict):
                day, value = str(point.get("date", ""))[:10], point.get("value")
            else:
                continue
            if len(day) == 10 and isinstance(value, (int, float)) and math.isfinite(float(value)):
                values[day] = float(value)
        if len(values) >= 2:
            dated[symbol] = values
    common_dates = sorted(set.intersection(*(set(values) for values in dated.values()))) if dated else []
    if len(common_dates) < 2:
        common_dates = []
    available = {symbol: candidates[symbol] for symbol in dated if symbol in candidates and common_dates and set(common_dates).issubset(dated[symbol])}
    coverage_value = sum(value for symbol, value in valid if symbol in available)
    coverage = coverage_value / total if total else 0.0
    covered_total = coverage_value
    concentration = sum((value / covered_total) ** 2 for symbol, value in valid if symbol in available) if covered_total else 0.0
    if available:
        common_dates = sorted(set.intersection(*(set(dated[symbol]) for symbol in available)))
    else:
        common_dates = []
    returns = {symbol: [dated[symbol][day] for day in common_dates] for symbol in available}
    portfolio_returns = [sum(weights[symbol] * returns[symbol][index] for symbol in returns) for index in range(len(common_dates))]
    losses = [-value for value in portfolio_returns]
    quantile_loss = max(0.0, _quantile(losses, 0.95)) if losses else None
    tail = [loss for loss in losses if quantile_loss is not None and loss >= quantile_loss]
    expected_shortfall = sum(tail) / len(tail) if tail else None
    correlation: dict[str, float] = {}
    symbols = sorted(returns)
    for index, left in enumerate(symbols):
        for right in symbols[index + 1 :]:
            correlation[f"{left}:{right}"] = _corr(returns[left], returns[right])
    scenario_contribution: dict[str, float] = {}
    for name in ("bear", "base", "bull"):
        scenario_contribution[name] = sum(weights[symbol] * ((float(available[symbol][name]) / float(available[symbol]["price"]) - 1.0) if available[symbol].get(name) is not None and available[symbol].get("price") else 0.0) for symbol in available)
    flags = ("partial-coverage",) if coverage < 1.0 else ()
    return PortfolioRisk(coverage, concentration, correlation, quantile_loss, expected_shortfall, scenario_contribution, flags)

