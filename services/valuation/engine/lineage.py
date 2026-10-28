"""Small immutable lineage helpers for glass-box valuation explanations."""

from __future__ import annotations

from collections.abc import Iterable


def lineage_for(rows: Iterable[object]) -> tuple[dict[str, str], ...]:
    """Return stable, serializable source nodes from observation-like rows."""
    result: list[dict[str, str]] = []
    for row in rows:
        result.append(
            {
                "metric": str(getattr(row, "metric", "")),
                "periodEnd": str(getattr(row, "period_end", "")),
                "filedAt": str(getattr(row, "filed_at", "")),
                "source": str(getattr(row, "source", "")),
                "sourceRef": str(getattr(row, "source_ref", "") or ""),
            }
        )
    return tuple(result)

