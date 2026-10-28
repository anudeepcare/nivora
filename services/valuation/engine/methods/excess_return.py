"""Residual-income method for banks and other financial institutions."""

from __future__ import annotations

from typing import Any

from ..rates import RateInputs
from ..route import Route
from .common import currency, finite, get, make_result, shares


def run(route: Route, inputs: Any, rates: RateInputs):
    book = finite(get(inputs, "book_equity"))
    roe = finite(get(inputs, "roe"))
    if book is None or book <= 0 or roe is None:
        return make_result(status="unavailable", method="excess-return", base=None, currency=currency(inputs), flags=("missing-book-or-roe",))
    ke = max(rates.cost_of_equity, rates.terminal_growth + 0.03)
    tg = max(-0.02, min(rates.terminal_growth, ke - 0.03))
    residual = book * (roe - ke)
    value = book + residual * (1.0 + tg) / (ke - tg)
    per_share = max(value / shares(inputs), 0.0)
    return make_result(status="supported", method="excess-return", base=per_share, bear=per_share * 0.78, bull=per_share * 1.22, currency=currency(inputs), confidence=78.0 - rates.confidence_penalty, assumptions={"roe": roe, "cost_of_equity": ke, "terminal_growth": tg})

