# AURYN V2 Final Product Design

## Product principle
AURYN is a mobile-first investment decision operating system. Search -> understand -> decide without scrolling; scroll -> verify -> explore.

## Brand
AURYN uses graphite/charcoal, warm ivory, stone and bronze. Green is not a brand color; positive/negative semantic colors may be used sparingly for returns or explicit status. All visible NIVORA branding is removed. Internal `nivora-*` module names may remain where they are stable implementation APIs.

## Decision architecture
Above the fold on desktop: canonical instrument identity/price, long-term view, new-money action, owner action, confidence, top reasons, entry, confirmation, reassess/protect, and compact evidence pillars. Mobile first viewport prioritizes price, call, new-money, owner action, reasons and levels.

Core evidence pillars: Business Quality; Financial Strength; Growth & Profitability; Valuation & Expectations; Earnings & Revisions; Technical Setup; Analyst/Ownership Evidence; Catalysts; Risk Pressure; Data Confidence. Each important metric supports contextual explanation next to its label: what it measures, why it matters, interpretation, contributing evidence, and freshness/source when available.

## Data integrity
Canonical symbol/exchange/currency must be consistent across quote, regular close, history, portfolio valuation and decision inputs. Large quote/regular-close disagreement must be surfaced as an integrity issue instead of silently displayed. Missing evidence is uncertainty, not bearish evidence.

## Research depth
Below the fold: Overview, Business, Financials, Valuation, Earnings, Analysts, Technicals, Ownership, Catalysts, Risk, Evidence. Advanced detail is progressively disclosed and does not delay the first decision surface.

## Portfolio
Portfolio first answers: value, cost basis, unrealized P/L, cash, selected-period return, SPY/QQQ comparison when exact history exists, concentration, risk, contribution/drivers, capital priorities and holdings requiring attention. Deep views: Performance, Allocation, Risk, Decisions, Holdings. No legacy "View allocation & risk" accordion.

## Monitor and Lab
Monitor unifies price alerts, decision changes, thesis/risk changes and catalyst/earnings monitoring where existing data supports it. Trading Lab remains paper-only and explains each qualification, risk and execution gate.

## Mobile
Phone is a first-class composition: no horizontal page overflow; no desktop table squeezing; no content under bottom navigation; compact scrollable controls; bottom sheets for explanations; minimum readable typography; touch-first interactions.

## Public/auth
Landing, login, registration, methodology, legal/privacy/risk and account surfaces share the same AURYN logo and vocabulary. Public Methodology never exposes stale product labels such as V61.

## Performance
Prioritize canonical quote and decision first; defer deep evidence; keep search responsive; avoid decorative nonfunctional controls and repeated data requests.
