"""Mid-cycle earnings method for cyclical businesses."""

from .common import currency, finite, get, make_result, shares


def run(route, inputs, rates):
    earnings = finite(get(inputs, "normalized_ebitda", get(inputs, "ebitda")))
    if earnings is None or earnings <= 0:
        return make_result(status="unavailable", method="cyclical-midcycle", base=None, currency=currency(inputs), flags=("missing-normalized-earnings",))
    multiple = max(4.0, min(14.0, 1.0 / max(rates.wacc - rates.terminal_growth, 0.06)))
    value = max(earnings * multiple + max(finite(get(inputs, "cash"), 0.0) or 0.0, 0.0) - max(finite(get(inputs, "debt"), 0.0) or 0.0, 0.0), 0.0) / shares(inputs)
    return make_result(status="supported", method="cyclical-midcycle", base=value, bear=value * 0.65, bull=value * 1.35, currency=currency(inputs), confidence=62.0 - rates.confidence_penalty, assumptions={"midcycle_multiple": multiple})

