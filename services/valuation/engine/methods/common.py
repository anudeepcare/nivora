"""Shared deterministic result types and guarded input accessors."""

from __future__ import annotations

from dataclasses import dataclass, field
import hashlib
import json
import math
from collections.abc import Mapping
from typing import Any


def get(inputs: Any, name: str, default: Any = None) -> Any:
    if isinstance(inputs, Mapping):
        return inputs.get(name, default)
    return getattr(inputs, name, default)


def finite(value: Any, default: float | None = None) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    return number if math.isfinite(number) else default


@dataclass(frozen=True)
class MethodResult:
    status: str
    method: str
    base: float | None
    bear: float | None = None
    bull: float | None = None
    currency: str = "USD"
    confidence: float = 0.0
    flags: tuple[str, ...] = field(default_factory=tuple)
    assumptions: dict[str, float | str] = field(default_factory=dict)
    trace_id: str = ""


def make_result(
    *,
    status: str,
    method: str,
    base: float | None,
    bear: float | None = None,
    bull: float | None = None,
    currency: str = "USD",
    confidence: float = 0.0,
    flags: tuple[str, ...] = (),
    assumptions: dict[str, float | str] | None = None,
) -> MethodResult:
    payload = {
        "status": status,
        "method": method,
        "base": base,
        "bear": bear,
        "bull": bull,
        "currency": currency,
        "confidence": confidence,
        "flags": flags,
        "assumptions": assumptions or {},
    }
    trace = "valuation-" + hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()[:24]
    return MethodResult(trace_id=trace, **payload)


def shares(inputs: Any) -> float:
    value = finite(get(inputs, "shares_outstanding", get(inputs, "shares_diluted", get(inputs, "shares", 1.0))), 1.0)
    return max(value or 1.0, 1e-9)


def currency(inputs: Any) -> str:
    value = get(inputs, "currency", "USD")
    return str(value) if value else "USD"

