"""Deterministic percentile scenarios and a bounded reverse-DCF solver."""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any

from .methods.common import MethodResult, finite, get
from .methods.dcf import dcf_value
from .rates import RateInputs


@dataclass(frozen=True)
class ScenarioCase:
    name: str
    value: float
    assumptions: dict[str, float | str]


@dataclass(frozen=True)
class Cases:
    bear: ScenarioCase
    base: ScenarioCase
    bull: ScenarioCase
    volatility: float


@dataclass(frozen=True)
class ImpliedGrowth:
    value: float
    lower: float
    upper: float
    iterations: int


def build_cases(base_inputs: Any, method_result: MethodResult, volatility: float) -> Cases:
    vol = max(0.0, min(float(volatility) if math.isfinite(float(volatility)) else 0.0, 1.5))
    base = max(method_result.base or 0.0, 0.0)
    bear = method_result.bear if method_result.bear is not None else base * max(0.10, 1.0 - vol)
    bull = method_result.bull if method_result.bull is not None else base * (1.0 + vol)
    bear = max(0.0, bear)
    bull = max(0.0, bull)
    assumptions = method_result.assumptions.copy()
    assumptions["volatility"] = vol
    assumptions["scenario_method"] = "deterministic-percentile"
    assumptions["scenario_note"] = "Each displayed case uses the stored assumptions used to calculate its value."
    def case_assumptions(name: str, shift: float) -> dict[str, float | str]:
        values = {**assumptions, "case_shift": shift}
        if name == "bear" and "bear_growth" in assumptions:
            values.update({"growth": assumptions["bear_growth"], "terminal_growth": assumptions.get("bear_terminal_growth", assumptions.get("terminal_growth", 0.0))})
        elif name == "bull" and "bull_growth" in assumptions:
            values.update({"growth": assumptions["bull_growth"], "terminal_growth": assumptions.get("bull_terminal_growth", assumptions.get("terminal_growth", 0.0))})
        return values
    return Cases(
        bear=ScenarioCase("bear", bear, case_assumptions("bear", -vol)),
        base=ScenarioCase("base", base, case_assumptions("base", 0.0)),
        bull=ScenarioCase("bull", bull, case_assumptions("bull", vol)),
        volatility=vol,
    )


def reverse_growth(inputs: Any, target_price: float, rates: RateInputs) -> ImpliedGrowth | None:
    target = finite(target_price)
    fcf = finite(get(inputs, "fcf"))
    if fcf is None:
        fcf = finite(get(inputs, "fcf_ttm"))
    if fcf is None:
        fcf = finite(get(inputs, "fcf_after_sbc"))
    if target is None or target <= 0 or fcf is None or fcf <= 0:
        return None
    low, high = -0.50, 0.50
    low_value = dcf_value(inputs, rates, low)
    high_value = dcf_value(inputs, rates, high)
    if low_value is None or high_value is None or target < low_value or target > high_value:
        return None
    for index in range(80):
        mid = (low + high) / 2.0
        value = dcf_value(inputs, rates, mid)
        if value is None:
            return None
        if value < target:
            low = mid
        else:
            high = mid
    return ImpliedGrowth((low + high) / 2.0, -0.50, 0.50, 80)

