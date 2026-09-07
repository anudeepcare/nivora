# AURYN V4 Analyst Decision OS — Design

**Date:** 2026-09-07  
**Status:** Proposed architecture approved in chat; implementation not started  
**Scope:** Core stock-analysis and decision engine, explanation depth, decision persistence, and UI contract. Market-wide scanner expansion and live-money execution are explicitly out of scope for this phase.

## 1. Goal

Transform AURYN from a decision-enhanced indicator/factor application into a true **investment decision operating system**.

AURYN V4 must answer the question a user actually has:

> **What should I do with this stock now, why, for what horizon, and what would make the decision change?**

The product must think with institutional-grade depth while remaining useful to beginners. Beginner, Pro, and Extreme Pro modes must use the **same canonical engine and same decision**; only explanation depth and diagnostics differ.

V4 must preserve the strongest existing production guarantees: evidence provenance, missing-data honesty, slow-thesis stability, valuation sanity, calibration/forward validation, portfolio context, versioned outcomes, and paper-trading safety.

## 2. Non-goals for V4 foundation

This phase does **not**:

- enable live-money autonomous trading;
- claim guaranteed returns or guaranteed predictive accuracy;
- make an LLM the source of numeric truth;
- treat a model score as a probability unless it has a version-matched calibrated mapping;
- build the full 4,500-stock scanner universe yet;
- replace proven provider, caching, portfolio, calibration, or paper-broker infrastructure without a concrete reason;
- create separate decision algorithms for Beginner, Pro, and Extreme Pro users.

## 3. Product principles

### 3.1 Decision first

Every decision-grade equity analysis must lead with one primary investment action:

- `STRONG_BUY`
- `BUY`
- `HOLD`
- `REDUCE`
- `SELL`

`INSUFFICIENT_EVIDENCE` is allowed only when AURYN cannot make a defensible decision because critical evidence is missing, stale, contradictory beyond configured limits, or unsupported for that security type. It must not be used as a generic escape hatch.

The legacy user-facing tendency toward `WAIT_FOR_CONFIRMATION` must be removed from the primary investment verdict. Confirmation may still affect **position size, add timing, or trading-horizon action**.

### 3.2 Separate company truth from stock timing

AURYN must never collapse these into one score:

- Business quality
- Moat
- Thesis strength
- Thesis direction
- Narrative / expectations
- Valuation
- Technical state
- Sector / industry state
- Catalysts
- Risk
- Portfolio fit

A high-quality business can be a poor buy at the current price. A weak long-term business can still present a valid short-duration trade. Technical weakness alone cannot rewrite slow-moving business evidence.

### 3.3 Same brain, different depth

All users receive the same canonical decision object.

- **Beginner:** action, plain-English thesis, top reasons, risk, simple plan, what changes the call.
- **Pro:** all Beginner content plus factor decomposition, bull/base/bear, valuation, technical state, catalysts, sector context, thesis breakers, portfolio fit.
- **Extreme Pro:** all Pro content plus raw factor evidence, model disagreement, provenance, validation state, cohort calibration, red-team objections, committee votes, regime diagnostics, and decision history.

User mode is a **presentation policy**, never an engine input.

### 3.4 Sector- and lifecycle-aware reasoning

AURYN must first understand what kind of company it is analyzing before deciding how to grade it.

A pre-scale satellite company must not be judged using the same core metric weights as a mature bank, SaaS compounder, memory semiconductor, insurer, miner, or AI infrastructure operator.

### 3.5 Evidence before narrative

Numeric and factual claims come from structured providers, SEC evidence, market data, deterministic calculations, and versioned models.

The agentic/LLM layer may:

- synthesize evidence;
- detect contradictions;
- identify missing questions;
- summarize narrative change;
- construct bull/base/bear reasoning;
- challenge the thesis;
- explain the final decision.

It may **not invent financial values, override hard evidence silently, or independently generate a numeric buy/sell signal from prose intuition**.

## 4. Canonical security model

Replace the narrow archetype classifier with a layered classification object.

```ts
interface SecurityClassification {
  assetClass: "EQUITY" | "ETF" | "REIT" | "FINANCIAL" | "BIOTECH" | "MINER" | "CRYPTO" | "OTHER";
  sector: string | null;
  industry: string | null;
  businessModel: BusinessModel;
  lifecycle: LifecycleStage;
  capitalIntensity: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" | "UNKNOWN";
  cyclicality: "DEFENSIVE" | "MODERATE" | "CYCLICAL" | "HIGHLY_CYCLICAL" | "UNKNOWN";
  profitabilityStage: "PRE_REVENUE" | "PRE_PROFIT" | "PROFITABLE" | "MATURE" | "UNKNOWN";
  confidence: number;
  evidence: EvidenceRef[];
}
```

Initial `BusinessModel` coverage should include at least:

- SaaS / software
- marketplace / ad-tech
- semiconductor designer
- semiconductor memory / cyclical
- networking / compute infrastructure
- AI / data-center infrastructure
- power infrastructure / utility
- bank
- insurer
- fintech / payments
- REIT
- biotech / pharma
- medtech
- energy
- industrial
- consumer
- space / satellite
- defense
- miner / commodity producer
- general compounder
- turnaround / distressed

Lifecycle stages:

- `PRE_COMMERCIAL`
- `VALIDATION`
- `INFLECTION`
- `HYPERGROWTH`
- `SCALE`
- `COMPOUNDER`
- `MATURITY`
- `DECLINE_OR_REINVENTION`

Classification must expose confidence and evidence. Unsupported confidence must degrade decision confidence rather than silently choosing `GENERAL` and pretending precision.

## 5. Master factor universe

The canonical engine must support a broad factor universe. Each security model activates, deactivates, or reweights factors based on classification, lifecycle, horizon, and evidence coverage.

### 5.1 Business quality

Examples:

- revenue engine quality;
- recurring vs transactional mix;
- customer retention / concentration;
- pricing power;
- gross-margin quality;
- operating leverage;
- FCF conversion;
- ROIC / capital efficiency;
- balance-sheet strength;
- dilution history;
- management execution;
- capital allocation;
- unit economics.

### 5.2 Growth and inflection

Examples:

- revenue / EPS / FCF growth;
- acceleration vs deceleration;
- estimate revision breadth;
- margin inflection;
- backlog / bookings / capacity;
- market-share gains;
- product adoption;
- supply-demand imbalance;
- new TAM opening;
- customer quality improvement.

### 5.3 Moat

AURYN must score both **moat strength** and **moat direction**.

Potential components:

- technology / IP;
- network effects;
- switching costs;
- scale advantage;
- data advantage;
- distribution;
- brand;
- regulatory barriers;
- capital barriers;
- supply-chain advantage;
- ecosystem lock-in.

Outputs:

```ts
interface MoatAssessment {
  score: number | null;
  direction: "EXPANDING" | "STABLE" | "ERODING" | "UNKNOWN";
  delta: number | null;
  drivers: EvidenceBackedReason[];
  threats: EvidenceBackedReason[];
}
```

### 5.4 Narrative and expectations

This is not generic sentiment. It answers:

- What does the market currently believe this company is?
- What is it becoming?
- Is the narrative strengthening, peaking, decaying, or being re-rated?
- What assumptions appear embedded in the current price?
- What does AURYN believe the market may be missing?

Outputs must separate `marketNarrative`, `aurynThesis`, and `contrarianEdge`.

### 5.5 Fundamentals and earnings

Use annual and quarterly evidence separately. Include:

- revenue / EPS / margins / FCF;
- earnings quality;
- surprises;
- guidance;
- revisions;
- balance sheet;
- working capital where relevant;
- sector-specific operating KPIs.

### 5.6 Valuation and expectations

Valuation must be sector/lifecycle aware. It can use combinations of:

- P/E / PEG;
- EV/Sales;
- EV/EBITDA;
- FCF yield;
- price/book for appropriate financials;
- NAV / AFFO for REITs;
- normalized-cycle earnings for cyclicals;
- unit or capacity economics for infrastructure;
- scenario valuation for pre-scale companies;
- peer-relative and historical percentile;
- reverse-expectations analysis.

AURYN must distinguish `great company` from `great stock at this price`.

### 5.7 Technical and price structure

Technical analysis is a timing/risk input, not the whole investment thesis.

Support:

- multi-timeframe trend;
- market structure;
- 20/50/200 references;
- RSI / MACD / ADX where useful;
- Bollinger compression / expansion;
- ATR / volatility regime;
- relative strength vs benchmark and sector;
- volume / relative volume;
- OBV / accumulation-distribution proxies;
- breakout / retest / support-resistance state;
- extension / falling-knife risk;
- gap behavior;
- confirmation state.

### 5.8 Positioning and flows

When reliable data is available:

- institutional ownership changes;
- insider transactions;
- short interest;
- ETF / index exposure;
- options volume / OI / skew;
- gamma levels;
- crowding / flow proxies.

Missing or unlicensed data must remain unavailable, not synthesized.

### 5.9 Catalysts

Examples:

- earnings;
- product launches;
- capacity online dates;
- contracts;
- regulatory events;
- FDA events;
- investor days;
- strategic partnerships;
- macro-sensitive milestones.

Each catalyst needs date, expected relevance, direction uncertainty, and source.

### 5.10 Sector / industry

AURYN must evaluate:

- industry cycle;
- peer relative strength;
- sector breadth;
- valuation regime;
- demand / supply;
- capex cycle;
- competitive intensity;
- leadership rotation;
- relevant commodity / rate sensitivity.

### 5.11 Macro / regime

Macro is applied only where material. Potential inputs:

- rates;
- liquidity;
- credit spreads;
- volatility;
- dollar;
- inflation;
- commodities;
- broad-market trend / breadth.

The engine must classify regime and allow regime to alter thresholds, risk budgets, and timing requirements without rewriting slow company truth.

### 5.12 Risk

Risk is multidimensional, not a single volatility number:

- financial / leverage;
- dilution;
- accounting / governance;
- customer concentration;
- regulatory;
- competition;
- technology obsolescence;
- binary-event risk;
- execution;
- cyclicality;
- liquidity;
- valuation fragility;
- model disagreement.

## 6. Sector/lifecycle model registry

Create a model registry rather than one global factor weighting table.

```ts
interface AnalystModelDefinition {
  id: string;
  version: string;
  appliesTo: ClassificationPredicate[];
  factorWeights: Partial<Record<CanonicalFactorKey, number>>;
  requiredEvidence: EvidenceRequirement[];
  optionalEvidence: EvidenceRequirement[];
  hardVetoes: DecisionVeto[];
  softConstraints: DecisionConstraint[];
  valuationMethod: ValuationMethodId;
  horizonRules: HorizonRule[];
}
```

The registry chooses the best-supported model from classification evidence. AURYN must record the selected model ID/version with every decision.

Initial models should be narrow enough to be testable. V4 foundation should ship a high-quality initial set rather than dozens of shallow pseudo-models.

Recommended first wave:

1. General compounder / mature growth
2. SaaS / software / marketplace
3. Semiconductor designer / networking
4. Semiconductor cyclical / memory
5. AI / data-center / power infrastructure
6. Pre-scale / space / frontier technology
7. Financials (bank + insurer variants)
8. Biotech / pre-profit
9. REIT
10. Energy / miner / commodity cyclical

## 7. Thesis engine

AURYN must maintain a persistent investment thesis separate from price movement.

```ts
interface InvestmentThesis {
  strength: MetricProvenance<number>;
  direction: "STRENGTHENING" | "STABLE" | "WEAKENING" | "BROKEN";
  directionDelta: number | null;
  companyState: string;
  whyItCanWin: EvidenceBackedReason[];
  marketMayBeMissing: EvidenceBackedReason[];
  strengtheningEvidence: EvidenceBackedReason[];
  weakeningEvidence: EvidenceBackedReason[];
  invalidationConditions: ThesisBreaker[];
  lastMaterialChangeAt: string;
}
```

`thesis-stability.ts` remains a core invariant: price-only evidence cannot alter slow-thesis state.

Thesis direction changes only when meaningful slow or strategic evidence changes.

## 8. Decision engine

### 8.1 Inputs

The canonical decision engine consumes:

1. security classification;
2. sector/lifecycle analyst model;
3. slow company evidence;
4. forward / catalyst evidence;
5. valuation / expectations;
6. technical / market timing;
7. risk;
8. regime;
9. model reliability / evidence coverage;
10. portfolio context when available.

### 8.2 Resolution sequence

The final decision must not be a naive average of all factors.

Use this sequence:

1. **Classify** the company and lifecycle.
2. **Build slow thesis** from business, moat, fundamentals, future evidence.
3. **Model expectations / valuation** against that thesis.
4. **Assess timing and technical state** independently.
5. **Apply hard vetoes** (fraud/governance, severe balance-sheet risk, missing critical evidence, broken thesis, etc.).
6. **Apply soft constraints** (overextension, near binary event, fragile valuation, regime risk, concentration).
7. **Resolve each horizon** rather than averaging horizons.
8. **Run adversarial/red-team review**.
9. **Synthesize canonical investment action**.
10. **Generate position plan** consistent with the action.
11. **Persist decision + evidence + engine/model versions**.

### 8.3 Canonical action contract

```ts
type PrimaryInvestmentAction =
  | "STRONG_BUY"
  | "BUY"
  | "HOLD"
  | "REDUCE"
  | "SELL"
  | "INSUFFICIENT_EVIDENCE";

interface HorizonDecision {
  horizon: "NOW" | "SWING" | "SIX_TO_TWELVE_MONTHS" | "THREE_TO_FIVE_YEARS";
  action: PrimaryInvestmentAction;
  confidence: DecisionConfidence;
  reasonIds: string[];
}
```

The product displays one headline `primaryAction`, then horizon-specific decisions underneath.

### 8.4 New investor vs owner vs trader

The same canonical evidence can produce audience-specific plans without changing underlying truth.

```ts
interface AudienceDecision {
  newInvestor: PositionActionPlan;
  owner: PositionActionPlan;
  trader: PositionActionPlan | null;
}
```

Examples:

- Primary `BUY`, new investor `START 50%`, owner `HOLD/ADD`, trader `NO SWING ENTRY`.
- Primary `HOLD`, new investor `NO NEW CAPITAL`, owner `HOLD`, trader `SELL/EXIT` when technical structure breaks.
- Primary `SELL`, both new and owner views remain decisively negative.

### 8.5 Position plan

For actionable decisions, AURYN should provide:

- initial allocation recommendation as a percentage of the intended position, not personalized dollars unless portfolio context exists;
- preferred entry zone;
- add-on conditions;
- trim conditions;
- technical invalidation where relevant;
- thesis invalidation separately;
- scenario targets / fair-value range;
- time horizon;
- event risk warnings;
- explicit reason for staged vs full entry.

No price target or entry zone may be shown as high-confidence if the supporting evidence is low-confidence.

## 9. Confidence and probability semantics

AURYN must not conflate a score with probability of profit.

### 9.1 Decision confidence

`DecisionConfidence` measures confidence in the **quality of the decision process**, using:

- evidence coverage;
- evidence freshness;
- source quality;
- model suitability;
- cross-model agreement;
- valuation robustness;
- calibration maturity;
- historical regime coverage.

### 9.2 Predictive probability

Only show values such as “68% probability target before invalidation” when a version-matched historical/OOS/forward cohort supports that exact claim.

```ts
interface PredictiveProbability {
  value: number;
  eventDefinition: string;
  sampleSize: number;
  engineVersion: string;
  modelVersion: string;
  calibrationWindow: string;
  validationState: "BACKTESTED" | "OOS" | "FORWARD_VALIDATED";
}
```

If sample size or validation is inadequate, hide the probability and show `collecting evidence` in Extreme Pro diagnostics.

## 10. Agentic investment committee

The agentic layer is a structured reviewer, not the numeric oracle.

Logical roles:

- Business Analyst
- Sector Analyst
- Moat Analyst
- Fundamental Analyst
- Valuation Analyst
- Technical Analyst
- Catalyst Analyst
- Risk Analyst
- Red-Team Analyst
- Portfolio Analyst
- AURYN CIO Synthesizer

These may initially run through one orchestrated model call with role-separated prompts and structured JSON rather than many expensive independent calls. Physical multi-agent execution is an optimization, not a product requirement.

### 10.1 Committee contract

Each role returns:

- stance: bullish / neutral / bearish;
- confidence;
- evidence IDs used;
- strongest reason;
- strongest objection;
- missing evidence;
- whether it recommends changing the deterministic engine's preliminary action.

The CIO layer may recommend an upgrade/downgrade only with cited evidence IDs and explicit reason codes. Hard-veto logic remains deterministic.

All model output must be schema-validated and stored separately from deterministic factors.

## 11. Contrarian edge

AURYN should expose a signature insight:

> **What may the market be missing?**

This must compare evidence-backed market expectations against AURYN's thesis, not generate promotional prose.

Possible states:

- `POSITIVE_EDGE`
- `NEGATIVE_EDGE`
- `CONSENSUS_ALIGNED`
- `NO_DEFENSIBLE_EDGE`

The card must include supporting evidence and the specific assumption where AURYN differs from the market.

## 12. Bull / base / bear scenarios

Scenarios must be linked to explicit assumptions, not only price numbers.

```ts
interface ScenarioCase {
  name: "BEAR" | "BASE" | "BULL";
  fairValue: number | null;
  probability: number | null;
  assumptions: ScenarioAssumption[];
  catalysts: string[];
  invalidators: string[];
  confidence: MetricValidationState;
}
```

Probabilities are optional and only shown when calibration supports them. The existing scenario price machinery can be adapted, but V4 adds explicit operating assumptions.

## 13. Portfolio-aware decision overlay

Canonical security truth must remain portable across users. Portfolio personalization is a separate overlay.

Examples:

- standalone `BUY`, portfolio overlay `HOLD — exposure already excessive`;
- standalone `BUY`, portfolio overlay `ADD — low correlation and within risk budget`;
- standalone `HOLD`, portfolio overlay `TRIM — concentration/risk budget exceeded`.

Inputs may include:

- current weight;
- cost basis;
- sector / theme concentration;
- factor exposure;
- correlation;
- cash / liquidity;
- risk budget;
- user-stated horizon when available.

The overlay must never rewrite the stored canonical stock decision.

## 14. Decision persistence and learning

Every canonical decision must be reproducible.

Persist:

- symbol;
- decision timestamp;
- security classification + confidence;
- selected analyst model + version;
- engine version;
- evidence snapshot IDs;
- factor values;
- thesis state;
- moat state;
- valuation state;
- technical state;
- risk state;
- preliminary action;
- committee review;
- final action;
- audience/horizon plans;
- confidence;
- portfolio overlay separately;
- scenario cases;
- thesis invalidators.

Existing calibration and matured-outcome infrastructure should be extended rather than replaced.

Outcome measurement must support multiple horizons and benchmark-relative results. Never automatically promote model weights from outcomes; challenger promotion requires explicit versioning and validation.

## 15. UI contract

### 15.1 Stock page hierarchy

The first screen should answer the decision before showing analytics.

1. **AURYN Decision** — primary action, confidence, time horizon, risk.
2. **What to do** — new investor / owner / trader plan.
3. **Why** — strongest positive and negative reasons.
4. **Thesis & direction** — business, moat, narrative, thesis momentum.
5. **Plan** — entry/add/trim/invalidation/scenarios.
6. **Evidence** — factor and source drill-down.
7. **Proof** — calibration / historical cohort when available.

### 15.2 Beginner view

Default to:

- one action;
- one-sentence verdict;
- 3–5 reasons;
- risk in plain English;
- position plan;
- `what changes this decision`;
- explain unfamiliar terms inline.

Avoid raw indicator walls and unsupported percentages.

### 15.3 Pro view

Add:

- factor decomposition;
- valuation scenarios;
- technical structure;
- catalysts;
- sector/regime;
- thesis breakers;
- portfolio overlay;
- decision history.

### 15.4 Extreme Pro view

Add:

- factor provenance;
- raw evidence timestamps;
- selected analyst model/version;
- committee votes;
- deterministic vs agentic disagreement;
- source conflicts;
- calibration cohort;
- regime and model diagnostics;
- decision audit trail.

Changing mode must not trigger a different engine call or change the stored verdict.

## 16. API / domain evolution

Introduce a new V4 canonical domain rather than continuing to overload V65 `DecisionHorizonView`.

Recommended modules:

```text
lib/auryn/v4/domain.ts
lib/auryn/v4/classification.ts
lib/auryn/v4/model-registry.ts
lib/auryn/v4/factors/
lib/auryn/v4/thesis.ts
lib/auryn/v4/moat.ts
lib/auryn/v4/narrative.ts
lib/auryn/v4/valuation.ts
lib/auryn/v4/technicals.ts
lib/auryn/v4/risk.ts
lib/auryn/v4/regime.ts
lib/auryn/v4/decision.ts
lib/auryn/v4/committee.ts
lib/auryn/v4/portfolio-overlay.ts
lib/auryn/v4/persistence.ts
lib/auryn/v4/presentation.ts
```

Existing NIVORA/V65 modules remain adapters during migration. New V4 modules must not import UI components.

The stock API should eventually return a versioned contract:

```ts
interface AurynV4Analysis {
  version: "auryn-v4";
  symbol: string;
  classification: SecurityClassification;
  primaryAction: PrimaryInvestmentAction;
  horizonDecisions: HorizonDecision[];
  audienceDecisions: AudienceDecision;
  confidence: DecisionConfidence;
  thesis: InvestmentThesis;
  moat: MoatAssessment;
  narrative: NarrativeAssessment;
  factorSummary: CanonicalFactorSummary;
  valuation: ValuationAssessment;
  technicals: TechnicalAssessment;
  sector: SectorAssessment;
  catalysts: CatalystAssessment;
  risk: RiskAssessment;
  scenarios: ScenarioCase[];
  contrarianEdge: ContrarianEdge;
  committee: CommitteeSummary;
  evidence: EvidenceSummary;
  proof: ValidationSummary;
}
```

## 17. Missing-data and conflict policy

V4 must preserve the current principle: **missing is not neutral**.

Rules:

- unavailable evidence is omitted and weights renormalize only where the model explicitly permits;
- required evidence missing for a model lowers model suitability or triggers `INSUFFICIENT_EVIDENCE`;
- conflicting sources create an evidence conflict record;
- stale fast-market data can block timing/trade plans without rewriting long-term thesis;
- stale slow evidence lowers confidence but does not invent new values;
- narrative generation may not hide evidence conflicts.

## 18. Migration from current code

Preserve:

- `lib/auryn/evidence*.ts` provenance concepts;
- `lib/v65/thesis-stability.ts` slow-evidence invariant;
- `lib/nivora-decision-reality.ts` valuation/technical reality concepts where valid;
- existing calibration / matured outcome tables and flows;
- portfolio risk and learning infrastructure;
- paper-broker safety and auditability;
- canonical score-label consistency protections.

Replace or supersede:

- narrow `lib/auryn/classification.ts` archetype coverage;
- narrow `lib/auryn/factor-engine.ts` five-factor universe as the canonical analyst model;
- `WAIT_FOR_CONFIRMATION` as a primary investment outcome;
- mixed NIVORA/AURYN naming in newly touched V4 product surfaces;
- presentation that leads with score before decision.

Compatibility adapters should allow the current UI and tests to coexist while V4 is introduced behind versioned contracts.

## 19. Testing strategy

### 19.1 Unit tests

Test:

- classification and lifecycle routing;
- model registry selection;
- factor renormalization and required-evidence behavior;
- thesis stability;
- moat direction;
- narrative evidence references;
- action resolution;
- hard vetoes / soft constraints;
- horizon conflicts;
- portfolio overlay separation;
- confidence semantics;
- no probability without calibration.

### 19.2 Golden-company cases

Create curated cases representing materially different situations, including:

- high-quality compounder with weak technicals;
- early-stage frontier company with weak conventional fundamentals but strengthening validation;
- cyclical semiconductor at improving cycle inflection;
- technically strong stock with deteriorating business thesis;
- excellent company at extreme valuation;
- broken thesis despite cheap price;
- high-conviction standalone buy blocked by portfolio concentration;
- insufficient critical evidence.

Tests should assert both the final action and **why** it was reached.

### 19.3 Historical / forward validation

For every engine/model version:

- freeze decision snapshots;
- evaluate defined horizons;
- benchmark against relevant index/sector;
- measure hit rate, excess return, drawdown, calibration and action distribution;
- report by model, lifecycle, sector, regime and confidence bucket.

### 19.4 UI contract tests

Assert:

- Beginner/Pro/Extreme Pro use identical canonical action;
- primary action appears before factor detail;
- no raw score is presented as probability;
- owner/new-investor guidance is explicit;
- thesis invalidators are accessible;
- evidence state and freshness are visible at Pro/Extreme Pro depth.

## 20. Release gates

V4 foundation cannot become the default production engine until:

1. Existing V65 production tests remain green or have an explicitly reviewed migration.
2. V4 golden-company decision tests pass.
3. No primary action is produced from missing critical evidence.
4. Scores are not mislabeled as probabilities.
5. Slow thesis cannot change from price-only updates.
6. Beginner/Pro/Extreme Pro produce the same canonical decision.
7. Portfolio overlay cannot mutate standalone security truth.
8. Decision snapshots are reproducible with engine/model/evidence versions.
9. Agentic committee output is schema-valid and evidence-referenced.
10. Historical/OOS validation is reported before any `probability of outcome` language is shown.
11. Live-money automation remains disabled.

## 21. Implementation decomposition

V4 should be implemented as four ordered sub-projects. This design governs all four, but each implementation step should be small enough to verify independently.

### V4-A — Canonical Analyst Core

- V4 domain contract
- classification/lifecycle engine
- model registry
- master factor framework
- thesis/moat/narrative structures
- deterministic primary + horizon action resolver
- adapters from current evidence
- golden-company tests

### V4-B — Decision UX + User Depth

- decision-first stock page
- Beginner / Pro / Extreme Pro presentation policy
- owner/new-investor/trader plan
- scenario + thesis-breaker UX
- unchanged verdict across modes

### V4-C — Agentic Investment Committee

- role schema
- evidence-bounded model orchestration
- red-team review
- CIO synthesis
- disagreement diagnostics
- strict schema/evidence validation

### V4-D — Proof + Learning Expansion

- V4 decision snapshot persistence
- model/version outcome cohorts
- horizon-specific calibration
- confidence/probability gates
- decision-history UI

The later market-wide opportunity scanner should consume V4 outputs rather than re-implement decision logic.

## 22. Success definition

AURYN V4 succeeds when a user can open any supported equity and immediately understand:

- **the action**;
- whether that action differs by horizon;
- what a new investor should do;
- what an existing owner should do;
- why the company can win or fail;
- whether the moat/thesis is strengthening or weakening;
- whether technical weakness is merely timing or true thesis deterioration;
- what the market may be missing;
- valuation and scenario asymmetry;
- what would change the call;
- how reliable the evidence and model are;
- how AURYN has historically performed on comparable, version-matched decisions when enough proof exists.

The product should feel like an equity analyst and portfolio manager making a decision, **not an indicator dashboard asking the user to interpret numbers**.
