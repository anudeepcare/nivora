"""No-value route used when a company cannot be responsibly valued."""

from .common import currency, make_result


def run(route, inputs, rates):
    return make_result(status="facts-only", method="facts-only", base=None, currency=currency(inputs), flags=("valuation-withheld",), confidence=0.0)

