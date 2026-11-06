"""Fail-closed valuation quality gates before an output reaches consumers."""

from __future__ import annotations

from dataclasses import dataclass, field
import math

from .methods.common import MethodResult
from .route import Route


@dataclass(frozen=True)
class GatedOutput:
    status: str
    method: str
    bear: float | None
    base: float | None
    bull: float | None
    confidence: float
    flags: tuple[str, ...] = field(default_factory=tuple)
    trace_id: str = ""


def apply_gates(output: MethodResult, route: Route) -> GatedOutput:
    flags = list(route.flags) + list(output.flags)
    values = [output.bear, output.base, output.bull]
    if output.status not in {"supported"} or any(v is None or not math.isfinite(v) or v <= 0 for v in values):
        flags.append("quality-gate-failed")
        return GatedOutput(output.status, output.method, None, None, None, 0.0, tuple(dict.fromkeys(flags)), output.trace_id)
    bear, base, bull = sorted(float(v) for v in values if v is not None)
    if "small-cap" in route.flags:
        # Prevent a single optimistic tail from creating an unbounded retail headline.
        bull = min(bull, base * 1.75)
        flags.append("small-cap-range-clipped")
    if bull / max(bear, 1e-9) > 5.0:
        flags.append("wide-range")
    confidence = max(0.0, min(100.0, output.confidence - (12.0 if "wide-range" in flags else 0.0)))
    return GatedOutput("supported", output.method, bear, base, bull, confidence, tuple(dict.fromkeys(flags)), output.trace_id)

