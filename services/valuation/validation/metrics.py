"""Backtest metrics and model-output monitoring without future leakage."""

from __future__ import annotations

from dataclasses import dataclass, field
import math


@dataclass(frozen=True)
class ValidationReport:
    coverage: float
    calibration: float | None
    rank_power: float | None
    decile_spread: float | None
    bias: float | None
    refusal_honesty: float
    family_stability: float | None
    bucket_counts: dict[str, int] = field(default_factory=dict)
    flags: tuple[str, ...] = ()


@dataclass(frozen=True)
class MonitorEvent:
    kind: str
    severity: str
    symbol: str | None
    details: str


def _first_realised_after(rows, as_of, horizon_days: int):
    from datetime import date, timedelta
    try:
        target = date.fromisoformat(str(as_of)[:10]) + timedelta(days=max(1, horizon_days))
    except ValueError:
        return None
    candidates = [(str(day), float(value)) for day, value in rows if str(day)[:10] >= target.isoformat() and math.isfinite(float(value))]
    return min(candidates, key=lambda item: item[0]) if candidates else None


def evaluate_backtest(point_in_time_outputs, realised_returns, horizon_days: int = 30, prior_outputs=None) -> ValidationReport:
    scored = []
    bucket_counts: dict[str, int] = {}
    for output in point_in_time_outputs:
        symbol = output.get("symbol")
        status = str(output.get("status", "refused"))
        bucket_counts[status] = bucket_counts.get(status, 0) + 1
        if status == "refused":
            continue
        price = output.get("price")
        value = ((output.get("cases") or {}).get("base") or {}).get("value")
        realised = _first_realised_after(realised_returns.get(symbol, ()), output.get("asOf", ""), horizon_days)
        if not isinstance(price, (int, float)) or not isinstance(value, (int, float)) or price <= 0 or realised is None:
            continue
        predicted = value / price - 1.0
        scored.append((predicted, realised[1], str(output.get("family", "unknown"))))
    eligible = sum(1 for output in point_in_time_outputs if _first_realised_after(realised_returns.get(output.get("symbol"), ()), output.get("asOf", ""), horizon_days) is not None)
    coverage = len(scored) / eligible if eligible else 0.0
    flags: list[str] = []
    if len(scored) < 3:
        flags.append("Insufficient scored observations for rank-power gate.")
        rank = None
    else:
        pairs = 0
        correct = 0
        for index, (left_pred, left_actual, _) in enumerate(scored):
            for right_pred, right_actual, _ in scored[index + 1 :]:
                pred_delta = left_pred - right_pred
                actual_delta = left_actual - right_actual
                if pred_delta and actual_delta:
                    pairs += 1
                    correct += int(pred_delta * actual_delta > 0)
        rank = correct / pairs if pairs else None
    if len(scored) < 10:
        flags.append("Insufficient scored observations for decile-spread gate.")
        decile = None
    else:
        ordered = sorted(scored, key=lambda row: row[0])
        width = max(1, len(ordered) // 10)
        decile = sum(row[1] for row in ordered[-width:]) / width - sum(row[1] for row in ordered[:width]) / width
    bias = sum(pred - actual for pred, actual, _ in scored) / len(scored) if scored else None
    calibration = sum((pred - actual) ** 2 for pred, actual, _ in scored) / len(scored) if scored else None
    refused = [row for row in point_in_time_outputs if str(row.get("status", "refused")) == "refused"]
    refusal_honesty = sum(1 for row in refused if ((row.get("cases") or {}).get("base") or {}).get("value") is None) / len(refused) if refused else 1.0
    family_stability = None
    if prior_outputs is not None:
        prior = {row.get("symbol"): row.get("family") for row in prior_outputs}
        common = [row for row in point_in_time_outputs if row.get("symbol") in prior]
        family_stability = sum(row.get("family") == prior[row.get("symbol")] for row in common) / len(common) if common else None
    return ValidationReport(coverage, calibration, rank, decile, bias, refusal_honesty, family_stability, bucket_counts, tuple(flags))


def monitor_outputs(outputs, prior_window) -> tuple[MonitorEvent, ...]:
    events: list[MonitorEvent] = []
    current = {row.get("symbol"): row for row in outputs if row.get("symbol")}
    prior = {row.get("symbol"): row for row in prior_window if row.get("symbol")}
    current_refusals = sum(str(row.get("status")) == "refused" for row in current.values())
    prior_refusals = sum(str(row.get("status")) == "refused" for row in prior.values())
    if current and current_refusals / len(current) > max(0.25, prior_refusals / max(len(prior), 1) + 0.10):
        events.append(MonitorEvent("refusal-rate", "warning", None, "Refusal rate increased beyond the configured monitoring band."))
    for symbol, row in current.items():
        cases = row.get("cases") or {}
        bear = ((cases.get("bear") or {}).get("value"))
        base = ((cases.get("base") or {}).get("value"))
        bull = ((cases.get("bull") or {}).get("value"))
        if all(isinstance(value, (int, float)) and value > 0 for value in (bear, base, bull)) and (bull / bear > 5 or base / bear > 4):
            events.append(MonitorEvent("extreme-output", "warning", symbol, "Scenario range is wider than the monitoring limit."))
        old = prior.get(symbol)
        if old:
            old_conf = old.get("confidence")
            new_conf = row.get("confidence")
            if isinstance(old_conf, (int, float)) and isinstance(new_conf, (int, float)) and new_conf - old_conf <= -10:
                events.append(MonitorEvent("confidence-drift", "warning", symbol, "Confidence declined by at least ten points."))
            if old.get("family") != row.get("family"):
                events.append(MonitorEvent("family-drift", "review", symbol, "The routed valuation family changed."))
        if row.get("flags") and str(row.get("status")) == "refused":
            events.append(MonitorEvent("rejection", "info", symbol, "Output was refused with explicit flags."))
    return tuple(events)

