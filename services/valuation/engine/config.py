"""Named valuation defaults; no hidden constants in model code."""

ERP_DEFAULT = 4.75
TAX_DEFAULT = 0.21
TERMINAL_GROWTH_FLOOR = 1.0
TERMINAL_GROWTH_CAP = 3.0
MIN_TERMINAL_SPREAD = 3.0
SIZE_PREMIUMS = ((10_000_000_000, 0.0), (2_000_000_000, 1.0), (300_000_000, 2.0), (50_000_000, 3.5), (0, 5.0))
DEBT_SPREADS = ((8.5, 0.7), (4.5, 1.1), (3.0, 1.6), (2.0, 2.6), (1.25, 4.5), (0.8, 7.0), (-float("inf"), 12.0))
CYCLICAL_SECTORS = frozenset({"energy", "materials", "mining", "autos", "chemicals", "shipping", "airlines", "semiconductors", "homebuilders"})


def size_premium(market_cap: float | None) -> float:
    if market_cap is None:
        return 5.0
    for floor, premium in SIZE_PREMIUMS:
        if market_cap >= floor:
            return premium
    return SIZE_PREMIUMS[-1][1]


def debt_spread(interest_coverage: float | None) -> float:
    coverage = interest_coverage if interest_coverage is not None else 0.0
    for floor, spread in DEBT_SPREADS:
        if coverage > floor:
            return spread
    return DEBT_SPREADS[-1][1]

