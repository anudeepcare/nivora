"""Routed valuation methods with deterministic, independently testable outputs."""

from .common import MethodResult
from . import cyclical, dcf, distress, excess_return, facts_only, funded_growth, reit


def run_method(route, inputs, rates) -> MethodResult:
    family = route.family
    if family in {"bank", "insurer"}:
        return excess_return.run(route, inputs, rates)
    if family == "reit":
        return reit.run(route, inputs, rates)
    if family == "funded-growth":
        return funded_growth.run(route, inputs, rates)
    if family == "cyclical":
        return cyclical.run(route, inputs, rates)
    if family == "distressed":
        return distress.run(route, inputs, rates)
    if family in {"shell", "untradeable", "crypto", "facts-only", "mature-loss-maker"}:
        return facts_only.run(route, inputs, rates)
    return dcf.run(route, inputs, rates)


__all__ = ["MethodResult", "run_method"]

