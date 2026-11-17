"""Cross-method agreement helper used by the gate layer."""

from __future__ import annotations

from .common import MethodResult, make_result


def cross_check(results: tuple[MethodResult, ...]) -> MethodResult:
    usable = [r for r in results if r.base is not None and r.status == "supported"]
    if not usable:
        return make_result(status="unavailable", method="cross-check", base=None, flags=("no-supported-methods",))
    values = sorted(r.base for r in usable)
    base = values[len(values) // 2]
    spread = (values[-1] - values[0]) / base if base else 1.0
    return make_result(status="supported", method="cross-check", base=base, bear=values[0], bull=values[-1], confidence=max(0.0, 90.0 - spread * 100.0), flags=("wide-method-spread",) if spread > 0.50 else ())

