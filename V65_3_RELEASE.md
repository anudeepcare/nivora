# NIVORA V65.3 — Decision First + Working Paper Proof

V65.3 is intentionally a product/UX + Trading Lab operability release. The production investment engine remains `ENGINE_VERSION=v65.2`; scoring weights and BUY thresholds are not retuned in this release. This prevents a UX correction from silently changing or contaminating model evidence.

## Analyze

- First viewport is now: long-term view, today's action, entry context, owner action, and reassessment condition.
- `BUY`/`STARTER BUY` with a non-actionable Today state is displayed as **BUY CANDIDATE**, avoiding the misleading impression that NIVORA is instructing an immediate purchase.
- WAIT explanations include actual timing/risk readings when they are material.
- Repetitive score/valuation/risk/horizon sections are moved under one **Deep research** disclosure.
- User-facing “thesis invalidation” language is replaced by **What changes the long-term view**.
- Metric help is a small inline **Details** text trigger beside the label. No question-mark badges, no engineering/version/validation jargon in the normal explanation.

## Trading Lab

- New **Run paper check now** action works from the signed-in product UI.
- It refreshes the user's portfolio-equity decision cohort, then runs the same Alpaca Paper execution/risk pipeline used by the automatic runner.
- Trading Lab first shows: paper account, decisions actually checked, paper orders actually sent, and realized paper result.
- Latest NO_INTENT/BLOCKED/SUBMITTED outcomes are visible immediately with their real reason.
- Setup/migration instructions are removed from the primary UX. Advanced scheduler/performance details are progressively disclosed.
- Live-money automatic execution remains disabled.

## Portfolio

- Fixes the false `0/100` equity-thesis-quality issue caused by null company scores being coerced to zero.
- Portfolio quality now uses real thesis evidence when present and treats missing scores as missing.
- Portfolio risk can consume the already-priced holdings from the client, avoiding a second storage/scan path that could incorrectly report “no funded positions.”
- First view is simplified to total value, deployable cash, holdings needing attention, concentration, strongest thesis, best new-money setup, and first review candidate.
- Allocation/risk structure and asset-entry forms are moved behind clean disclosures.

## Verification

- Existing engine/regression tests plus V65.3 UX/portfolio integrity tests pass.
- V65.3 keeps `ENGINE_VERSION=v65.2` by design; only Trading Lab/UX version identifiers advance.
