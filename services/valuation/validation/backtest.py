"""Named backtest entry point kept separate from metric primitives."""

from .metrics import ValidationReport, evaluate_backtest

__all__ = ["ValidationReport", "evaluate_backtest"]

