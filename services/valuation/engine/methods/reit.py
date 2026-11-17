"""AFFO and NAV cross-check for REITs."""

from __future__ import annotations

from typing import Any

from ..rates import RateInputs
from ..route import Route
from .common import currency, finite, get, make_result, shares


def run(route: Route, inputs: Any, rates: RateInputs):
    affo = finite(get(inputs, "affo"))
    nav = finite(get(inputs, "nav"))
    if affo is None or affo <= 0 or nav is None or nav <= 0:
        return make_result(status="unavailable", method="reit-affo-nav", base=None, currency=currency(inputs), flags=("missing-affo-or-nav",))
    cap_rate = max(rates.wacc - rates.terminal_growth, 0.04)
    income_value = affo / cap_rate
    equity = (0.65 * income_value) + (0.35 * nav)
    value = max(equity / shares(inputs), 0.0)
    return make_result(status="supported", method="reit-affo-nav", base=value, bear=value * 0.75, bull=value * 1.25, currency=currency(inputs), confidence=74.0 - rates.confidence_penalty, assumptions={"cap_rate": cap_rate, "affo": affo, "nav": nav})

