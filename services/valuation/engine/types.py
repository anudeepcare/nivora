"""Versioned, deterministic valuation contract scaffolding."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
from typing import TypedDict

MODEL_VERSION = "valuation@1.0.0"


@dataclass(frozen=True)
class ValuationInputs:
    symbol: str
    as_of: str


class Case(TypedDict):
    value: float | None
    vsPrice: float | None
    g0: float | None
    margin: float | None
    rate: float | None
    gT: float | None


class ValuationOutput(TypedDict):
    symbol: str
    asOf: str
    status: str
    family: str
    routeRule: int
    methods: list[dict[str, object]]
    price: float | None
    cases: dict[str, Case]
    impliedGrowth: float | None
    deliveredGrowth: float | None
    confidence: float
    dataQuality: float
    flags: list[str]
    refusalReason: str | None
    facts: dict[str, float | None]
    audit: dict[str, float | None]
    traceId: str
    modelVersion: str
    configHash: str


def _trace_id(inputs: ValuationInputs) -> str:
    digest = hashlib.sha256(f"{inputs.symbol}|{inputs.as_of}".encode("utf-8")).hexdigest()[:24]
    return f"valuation-{digest}"


def _empty_case() -> Case:
    return {"value": None, "vsPrice": None, "g0": None, "margin": None, "rate": None, "gT": None}


def value_stock(inputs: ValuationInputs) -> ValuationOutput:
    """Value a point-in-time snapshot; retain the request-only refusal boundary."""
    if hasattr(inputs, "observations"):
        from .index import value_snapshot

        return value_snapshot(inputs)  # type: ignore[arg-type]
    return {
        "symbol": inputs.symbol,
        "asOf": inputs.as_of,
        "status": "refused",
        "family": "unavailable",
        "routeRule": 0,
        "methods": [],
        "price": None,
        "cases": {"bear": _empty_case(), "base": _empty_case(), "bull": _empty_case()},
        "impliedGrowth": None,
        "deliveredGrowth": None,
        "confidence": 0.0,
        "dataQuality": 0.0,
        "flags": [],
        "refusalReason": "Valuation methods are not initialized for this snapshot.",
        "facts": {"netCash": None, "runwayMonths": None, "dilution3y": None, "cashPerShare": None},
        "audit": {"rf": None, "betaAdj": None, "erp": None, "sizePremium": None, "wacc": None, "tvShare": None},
        "traceId": _trace_id(inputs),
        "modelVersion": MODEL_VERSION,
        "configHash": "sha256:uninitialized",
    }

