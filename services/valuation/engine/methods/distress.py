"""Recovery-value screen for distressed businesses."""

from .common import currency, finite, get, make_result, shares


def run(route, inputs, rates):
    cash = max(finite(get(inputs, "cash"), 0.0) or 0.0, 0.0)
    debt = max(finite(get(inputs, "debt"), 0.0) or 0.0, 0.0)
    recovery = max(0.05, min(0.90, finite(get(inputs, "recovery_rate"), 0.35) or 0.35))
    value = max(cash + max(finite(get(inputs, "asset_value"), 0.0) or 0.0, 0.0) * recovery - debt, 0.0) / shares(inputs)
    if value <= 0:
        return make_result(status="refused", method="distress-recovery", base=None, currency=currency(inputs), confidence=10.0, flags=("negative-recovery",))
    return make_result(status="supported", method="distress-recovery", base=value, bear=value * 0.60, bull=value * 1.40, currency=currency(inputs), confidence=35.0, flags=("distress-override",), assumptions={"recovery_rate": recovery})

