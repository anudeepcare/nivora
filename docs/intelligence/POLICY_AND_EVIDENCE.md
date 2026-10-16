# AURYN intelligence policy — October 16, 2026

Policy: `auryn-intelligence-2026-10-16`. This is a rule-based research model. Its scores and scenario ranges are not calibrated probabilities or demonstrated investment outperformance.

## Independent dimensions

The shared adapter `lib/auryn/v931/canonical-assessment.ts` is used by interactive research and scheduled workers. It emits the exact decision, input snapshot and financial evidence subsequently saved by the authenticated server. A fresh quote can change displayed price without changing the saved research. Every consumer uses `research.decision` and its policy/snapshot ID when available. Prior client-authored snapshots remain in history but are not current trusted execution evidence.

Business quality is calculated from sourced reported operating economics. It is explicitly a proxy; it does not establish a competitive moat. Forward evidence is withheld when it merely repackages the same reported metrics. Missing data remains null. Frontier and infrastructure businesses need operating-specific evidence, rather than a penalty for not resembling a mature cash generator. Supported dimensions and unavailable dependencies are listed in the coverage registry.

The slow assessment uses business and any independent fundamental execution evidence. Price-derived risk and technicals cannot change it. A fundamental hard veto requires corroborated weak fundamental families. Technical invalidation stops a setup and pauses capital; it does not alone imply a failed business thesis. New-capital, owner and long-term actions are distinct.

The displayed diagnostic score weights business 24%, independent fundamentals 18%, valuation 16%, price structure 18%, catalyst context 8% and risk 16%, normalized over available families. This diagnostic score does not itself issue an order. Deployment combines valuation 25%, one combined technical family 42%, risk 23% and catalyst context 10%. Missing business, valuation or risk prevents an eligible new-capital instruction. Evidence coverage is capped by available families and never represents odds of profit.

Current/swing assessments use completed bars. Six-to-twelve-month outlook requires dated forward evidence and otherwise remains unassessed. Three-to-five-year research assesses the available durable business evidence; it does not predict a price target or guarantee returns. Personal view depth is independent of investment horizon.

## Financial sources and valuation

SEC facts retain taxonomy, concept, unit/currency, period, filing timestamp and accession. Quarter, YTD and TTM derivations retain input lineage. Contradictory facts do not silently select a convenient value. A later restatement is available only after its filing timestamp. Current shares and annual weighted diluted shares have different meanings and are not interchangeable.

Canonical valuation requires appropriate business coverage, sourced financial inputs, listed-share reconciliation and financing/claims review, plus a separate earnings cross-check. Bear/base/bull growth, discount and dilution rates are explicitly versioned AURYN assumptions. Value is calculated independently of price; price is compared afterward. Implied expectations and sensitivity outputs inherit those assumptions. Personal scenario exploration never overwrites the canonical decision or authorizes paper execution.

Missing operating capacity, satellite delivery, customer terms, financing or moat evidence remains a coverage limitation. Registry rows are not completed specialist valuation models. Options flow/gamma remains outside this release without a licensed feed and approved methodology.

## Paper execution and histories

Only trusted server-calculated current-policy snapshots can reach automatic execution. Quote, account, cash/exposure, broker session, strategy, pause, lease and duplicate-intent checks remain separate. A database lease protects concurrent runners, and durable intent identity prevents retry duplication. Broker acknowledgment is different from a fill. An ambiguous transmission is reconciled by client order ID rather than blindly resubmitted.

Paper simulation cannot demonstrate live fills, liquidity or real-money performance. No real-money trading is enabled. New migrations seed a paused paper control row. A verified administrator must intentionally resume after configuration checks.

Original decision-journal and review records are append-only and owner isolated. A later profitable outcome does not rewrite the original thesis or prove the decision process was sound. Saved contribution cadence is a planning setting; it is not a new unattended recurring brokerage scheduler.

## Evaluation boundaries

The release tests deterministic math, data lineage, dates, missing/stale data, permission boundaries and order safety. Synthetic reachability fixtures demonstrate that decisions can be expressed; they are not a portfolio backtest. The allocation replay compares policies against fixed DCA under the same dated contributions, includes idle cash, costs, slippage, drawdown and turnover, and prohibits same-close use of a newly known signal. Walk-forward windows use held-out intervals, but a supplied dataset must also disclose universe construction, corporate actions and fundamental publication history.

No new historical point-in-time dataset or matured multi-year outcome cohort was supplied for this release. Consequently the revised model's out-of-sample investment performance and calibration remain unvalidated. Candidate policy changes remain versioned and require evaluation; recording paper orders alone is not self-learning.
