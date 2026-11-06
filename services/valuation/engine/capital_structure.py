"""Fully diluted share-count waterfall using transparent treasury-stock math."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class OptionGrant:
    quantity: float
    strike: float
    kind: str = "option"


@dataclass(frozen=True)
class CapitalStructure:
    basic_shares: float
    rsus: float = 0.0
    options: tuple[OptionGrant, ...] = ()
    convertible_shares: float | None = 0.0


@dataclass(frozen=True)
class Waterfall:
    shares_diluted: float
    treasury_shares: float
    option_details: tuple[dict[str, float], ...]
    flags: tuple[str, ...]


def diluted_shares(capital_structure: CapitalStructure, price: float) -> Waterfall:
    flags: list[str] = []
    if capital_structure.basic_shares <= 0:
        return Waterfall(0.0, 0.0, (), ("Basic shares must be positive.",))
    if price <= 0:
        return Waterfall(capital_structure.basic_shares, 0.0, (), ("A positive price is required for treasury-stock dilution.",))
    incremental = 0.0
    details: list[dict[str, float]] = []
    for grant in capital_structure.options:
        if grant.quantity <= 0 or grant.strike < 0:
            flags.append("An option or warrant term is invalid and was excluded.")
            continue
        added = grant.quantity * max(0.0, 1.0 - grant.strike / price)
        incremental += added
        details.append({"quantity": grant.quantity, "strike": grant.strike, "incremental": added})
    if capital_structure.convertible_shares is None:
        flags.append("Convertible terms unavailable; no convertible dilution was invented.")
        convertible = 0.0
    else:
        convertible = max(0.0, capital_structure.convertible_shares)
    diluted = capital_structure.basic_shares + max(0.0, capital_structure.rsus) + incremental + convertible
    return Waterfall(diluted, max(0.0, capital_structure.rsus) + incremental + convertible, tuple(details), tuple(flags))

