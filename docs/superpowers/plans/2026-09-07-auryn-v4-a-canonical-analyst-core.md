# AURYN V4-A Canonical Analyst Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-safe AURYN V4 decision core: layered security classification, sector/lifecycle model routing, a broad evidence-aware factor framework, slow thesis/moat/narrative state, deterministic multi-horizon `STRONG_BUY / BUY / HOLD / REDUCE / SELL / INSUFFICIENT_EVIDENCE` resolution, and golden-company tests, while keeping V65 live behavior unchanged until V4-B explicitly switches the UI.

**Architecture:** Introduce an isolated `lib/auryn/v4/*` domain that consumes normalized evidence rather than UI state. Existing NIVORA/V65 code remains the production adapter during V4-A; a one-way migration adapter converts current evidence/decision artifacts into the V4 normalized input contract without making legacy scores the new source of truth. The V4 resolver classifies first, selects a model, evaluates required evidence and factor groups, stabilizes slow thesis/moat state, resolves horizons independently, then synthesizes one investment action without using `WAIT_FOR_CONFIRMATION`.

**Tech Stack:** Next.js 15.2.4, React 19, TypeScript 5.7.2, Node `node:test`, existing AURYN evidence/provenance modules, existing V65 slow-thesis stability helper, existing `.engine-test` CommonJS test compilation.

**Spec:** `docs/superpowers/specs/2026-09-07-auryn-v4-analyst-decision-os-design.md`

## Global Constraints

- Live-money autonomous trading remains disabled.
- Beginner, Pro, and Extreme Pro are presentation policies only; user mode must never enter the V4 core decision function.
- Primary investment actions are exactly `STRONG_BUY`, `BUY`, `HOLD`, `REDUCE`, `SELL`, and `INSUFFICIENT_EVIDENCE`.
- `WAIT_FOR_CONFIRMATION` is not a V4 primary investment action.
- Missing evidence is not neutral; required missing evidence must lower model suitability or produce `INSUFFICIENT_EVIDENCE`.
- Technical/price-only evidence may alter timing/horizon decisions but may not rewrite slow thesis state.
- Numeric/factual truth comes from structured evidence and deterministic calculations; V4-A has no LLM-generated numeric signals.
- No score may be labeled as probability of profit. V4-A exposes decision confidence only.
- Canonical stock truth remains independent of portfolio personalization in V4-A.
- Existing V65/NIVORA production behavior stays unchanged until a later migration task explicitly enables V4 on a product surface.
- Every V4 decision records engine version, analyst model ID/version, classification confidence, evidence coverage, and reason codes.

---

## File Structure

### Create

- `lib/auryn/v4/version.ts` — V4-A engine/model contract versions.
- `lib/auryn/v4/domain.ts` — all canonical V4-A types; no decision logic.
- `lib/auryn/v4/classification.ts` — layered asset/business-model/lifecycle classification with evidence-backed confidence.
- `lib/auryn/v4/model-registry.ts` — first-wave analyst model definitions and deterministic model selection.
- `lib/auryn/v4/factors.ts` — factor aggregation, required-evidence checks, permitted renormalization, model suitability.
- `lib/auryn/v4/moat.ts` — moat score/direction using only moat evidence.
- `lib/auryn/v4/thesis.ts` — slow investment thesis strength/direction using `stabilizeSlowMetric`.
- `lib/auryn/v4/narrative.ts` — structured market narrative, AURYN thesis distinction, and contrarian-edge state from cited evidence only.
- `lib/auryn/v4/confidence.ts` — decision-confidence calculation; explicitly not predictive probability.
- `lib/auryn/v4/decision.ts` — hard vetoes, soft constraints, horizon actions, headline action, reason codes.
- `lib/auryn/v4/current-evidence-adapter.ts` — one-way adapter from current AURYN/NIVORA evidence shapes into normalized V4-A input.
- `lib/auryn/v4/analyze.ts` — orchestration entry point `buildAurynV4CoreAnalysis()`.
- `tests/auryn-v4-domain.test.mjs` — domain/version/no-probability contract tests.
- `tests/auryn-v4-classification-models.test.mjs` — classifier/lifecycle/model-registry tests.
- `tests/auryn-v4-factors.test.mjs` — missing-data, renormalization, and suitability tests.
- `tests/auryn-v4-thesis-moat-narrative.test.mjs` — slow-thesis, moat direction, narrative provenance tests.
- `tests/auryn-v4-decision.test.mjs` — action/horizon/veto/soft-constraint tests.
- `tests/auryn-v4-golden-companies.test.mjs` — cross-archetype behavioral cases.

### Modify

- `tsconfig.engine.json` — compile V4 modules for `.engine-test` tests.
- `package.json` — add V4 test files to `test:engine` and a focused `test:v4-core` script.

### Explicitly unchanged in V4-A

- `lib/nivora-investor.ts`
- `lib/v65/action-policy.ts`
- stock-page React components
- portfolio UI/overlay logic
- calibration persistence tables
- agentic/LLM orchestration
- paper/live execution code

Those are intentionally deferred so V4-A can be verified without silently changing production decisions.

---

### Task 1: Establish the V4-A domain and version contract

**Files:**
- Create: `lib/auryn/v4/version.ts`
- Create: `lib/auryn/v4/domain.ts`
- Create: `tests/auryn-v4-domain.test.mjs`
- Modify: `tsconfig.engine.json`
- Modify: `package.json`

**Interfaces:**
- Produces: `SecurityClassification`, `BusinessModel`, `LifecycleStage`, `CanonicalFactorKey`, `FactorObservation`, `FactorAssessment`, `AnalystEvidenceBundle`, `InvestmentThesis`, `MoatAssessment`, `NarrativeAssessment`, `DecisionConfidence`, `HorizonDecision`, `AurynV4CoreAnalysis`, and `PrimaryInvestmentAction`.
- Produces version constants: `AURYN_V4_ENGINE_VERSION`, `AURYN_V4_DOMAIN_VERSION`, `AURYN_V4_MODEL_REGISTRY_VERSION`.

- [ ] **Step 1: Write the failing domain contract test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const domainPath=new URL("../lib/auryn/v4/domain.ts",import.meta.url);

test("V4 primary actions are decisive and contain no WAIT state",()=>{
  const s=fs.readFileSync(domainPath,"utf8");
  assert.match(s,/"STRONG_BUY"/);
  assert.match(s,/"BUY"/);
  assert.match(s,/"HOLD"/);
  assert.match(s,/"REDUCE"/);
  assert.match(s,/"SELL"/);
  assert.match(s,/"INSUFFICIENT_EVIDENCE"/);
  assert.doesNotMatch(s,/WAIT_FOR_CONFIRMATION/);
});

test("V4 confidence is not named or typed as profit probability",()=>{
  const s=fs.readFileSync(domainPath,"utf8");
  assert.match(s,/interface DecisionConfidence/);
  assert.doesNotMatch(s,/profitProbability|winProbability/);
});
```

- [ ] **Step 2: Run the test and verify it fails because the V4 domain does not exist**

Run:

```bash
node --test tests/auryn-v4-domain.test.mjs
```

Expected: FAIL with `ENOENT` for `lib/auryn/v4/domain.ts`.

- [ ] **Step 3: Add version constants**

Create `lib/auryn/v4/version.ts`:

```ts
export const AURYN_V4_ENGINE_VERSION="auryn-v4-a-core-1" as const;
export const AURYN_V4_DOMAIN_VERSION="auryn-v4-domain-1" as const;
export const AURYN_V4_MODEL_REGISTRY_VERSION="auryn-v4-model-registry-1" as const;
```

- [ ] **Step 4: Define the canonical V4-A types**

Create `lib/auryn/v4/domain.ts` with these exact enums/unions as the stable V4-A contract:

```ts
import type {EvidenceScope,EvidenceSource} from "../evidence";
import type {MetricValidationState} from "../../v65/domain";

export type PrimaryInvestmentAction=
  | "STRONG_BUY"
  | "BUY"
  | "HOLD"
  | "REDUCE"
  | "SELL"
  | "INSUFFICIENT_EVIDENCE";

export type Horizon="NOW"|"SWING"|"SIX_TO_TWELVE_MONTHS"|"THREE_TO_FIVE_YEARS";

export type BusinessModel=
  | "SAAS_SOFTWARE"
  | "MARKETPLACE_ADTECH"
  | "SEMICONDUCTOR_DESIGNER"
  | "SEMICONDUCTOR_MEMORY_CYCLICAL"
  | "NETWORKING_COMPUTE_INFRA"
  | "AI_DATA_CENTER_INFRA"
  | "POWER_UTILITY_INFRA"
  | "BANK"
  | "INSURER"
  | "FINTECH_PAYMENTS"
  | "REIT"
  | "BIOTECH_PHARMA"
  | "MEDTECH"
  | "ENERGY"
  | "INDUSTRIAL"
  | "CONSUMER"
  | "SPACE_SATELLITE"
  | "DEFENSE"
  | "MINER_COMMODITY"
  | "GENERAL_COMPOUNDER"
  | "TURNAROUND_DISTRESSED";

export type LifecycleStage=
  | "PRE_COMMERCIAL"
  | "VALIDATION"
  | "INFLECTION"
  | "HYPERGROWTH"
  | "SCALE"
  | "COMPOUNDER"
  | "MATURITY"
  | "DECLINE_OR_REINVENTION";

export type CanonicalFactorKey=
  | "BUSINESS_QUALITY"
  | "GROWTH_INFLECTION"
  | "MOAT"
  | "NARRATIVE_EXPECTATIONS"
  | "FUNDAMENTALS_EARNINGS"
  | "VALUATION"
  | "TECHNICALS"
  | "POSITIONING"
  | "CATALYSTS"
  | "SECTOR_INDUSTRY"
  | "MACRO_REGIME"
  | "RISK";

export interface EvidenceRef {
  id:string;
  key:string;
  source:EvidenceSource;
  scope:EvidenceScope;
  asOf:string|null;
  validationState:MetricValidationState;
}

export interface EvidenceBackedReason {
  id:string;
  text:string;
  evidenceIds:string[];
}

export interface SecurityClassificationInput {
  assetType?:string|null;
  sector?:string|null;
  industry?:string|null;
  name?:string|null;
  description?:string|null;
  revenue?:number|null;
  revenueGrowth?:number|null;
  operatingMargin?:number|null;
  fcf?:number|null;
  profitable?:boolean|null;
}

export interface SecurityClassification {
  assetClass:"EQUITY"|"ETF"|"REIT"|"FINANCIAL"|"BIOTECH"|"MINER"|"CRYPTO"|"OTHER";
  sector:string|null;
  industry:string|null;
  businessModel:BusinessModel;
  lifecycle:LifecycleStage;
  capitalIntensity:"LOW"|"MEDIUM"|"HIGH"|"EXTREME"|"UNKNOWN";
  cyclicality:"DEFENSIVE"|"MODERATE"|"CYCLICAL"|"HIGHLY_CYCLICAL"|"UNKNOWN";
  profitabilityStage:"PRE_REVENUE"|"PRE_PROFIT"|"PROFITABLE"|"MATURE"|"UNKNOWN";
  confidence:number;
  evidenceIds:string[];
}

export interface FactorObservation {
  factor:CanonicalFactorKey;
  score:number|null;
  reason:string;
  evidenceIds:string[];
  validationState:MetricValidationState;
}

export interface FactorAssessment extends FactorObservation {
  weight:number;
  available:boolean;
}

export interface MoatAssessment {
  score:number|null;
  direction:"EXPANDING"|"STABLE"|"ERODING"|"UNKNOWN";
  delta:number|null;
  drivers:EvidenceBackedReason[];
  threats:EvidenceBackedReason[];
}

export interface InvestmentThesis {
  strength:number|null;
  direction:"STRENGTHENING"|"STABLE"|"WEAKENING"|"BROKEN";
  directionDelta:number|null;
  companyState:string;
  whyItCanWin:EvidenceBackedReason[];
  marketMayBeMissing:EvidenceBackedReason[];
  strengtheningEvidence:EvidenceBackedReason[];
  weakeningEvidence:EvidenceBackedReason[];
  invalidationConditions:string[];
  evidenceFingerprint:string;
  lastMaterialChangeAt:string;
}

export interface NarrativeAssessment {
  marketNarrative:EvidenceBackedReason[];
  aurynThesis:EvidenceBackedReason[];
  contrarianEdge:{
    state:"POSITIVE_EDGE"|"NEGATIVE_EDGE"|"CONSENSUS_ALIGNED"|"NO_DEFENSIBLE_EDGE";
    reason:EvidenceBackedReason|null;
  };
}

export interface DecisionConfidence {
  score:number;
  label:"HIGH"|"MEDIUM"|"LOW";
  coverage:number;
  freshness:number;
  sourceQuality:number;
  modelSuitability:number;
  agreement:number;
  validationState:MetricValidationState;
}

export interface HorizonDecision {
  horizon:Horizon;
  action:PrimaryInvestmentAction;
  confidence:DecisionConfidence;
  reasonCodes:string[];
}

export interface AnalystEvidenceBundle {
  symbol:string;
  asOf:string;
  classificationInput:SecurityClassificationInput;
  evidenceRefs:EvidenceRef[];
  evidenceConflicts:string[];
  observations:FactorObservation[];
  moatSignals:FactorObservation[];
  moatReasons:{drivers:EvidenceBackedReason[];threats:EvidenceBackedReason[]};
  slowEvidenceFingerprint:string;
  priorThesis?:{strength:number;evidenceFingerprint:string;lastMaterialChangeAt:string};
  priorMoat?:{score:number;evidenceFingerprint:string;lastMaterialChangeAt:string};
  narrative:{market:EvidenceBackedReason[];auryn:EvidenceBackedReason[];expectationGapScore:number|null};
  thesisReasons:{positive:EvidenceBackedReason[];negative:EvidenceBackedReason[];marketMayBeMissing:EvidenceBackedReason[]};
  thesisInvalidators:string[];
  hardVetoes:string[];
  softConstraints:string[];
}

export interface AurynV4CoreAnalysis {
  version:"auryn-v4";
  engineVersion:string;
  symbol:string;
  classification:SecurityClassification;
  analystModel:{id:string;version:string;suitability:number};
  factors:Partial<Record<CanonicalFactorKey,FactorAssessment>>;
  thesis:InvestmentThesis;
  moat:MoatAssessment;
  narrative:NarrativeAssessment;
  primaryAction:PrimaryInvestmentAction;
  horizonDecisions:HorizonDecision[];
  confidence:DecisionConfidence;
  reasonCodes:string[];
}
```

- [ ] **Step 5: Add V4 files to engine compilation and test scripts**

Add the following paths to `tsconfig.engine.json` `include`:

```json
"lib/auryn/v4/version.ts",
"lib/auryn/v4/domain.ts",
"lib/auryn/v4/classification.ts",
"lib/auryn/v4/model-registry.ts",
"lib/auryn/v4/factors.ts",
"lib/auryn/v4/moat.ts",
"lib/auryn/v4/thesis.ts",
"lib/auryn/v4/narrative.ts",
"lib/auryn/v4/confidence.ts",
"lib/auryn/v4/decision.ts",
"lib/auryn/v4/current-evidence-adapter.ts",
"lib/auryn/v4/analyze.ts"
```

Add this focused script to `package.json`:

```json
"test:v4-core": "rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-domain.test.mjs tests/auryn-v4-classification-models.test.mjs tests/auryn-v4-factors.test.mjs tests/auryn-v4-thesis-moat-narrative.test.mjs tests/auryn-v4-decision.test.mjs tests/auryn-v4-golden-companies.test.mjs"
```

Append the same six V4 test files to the existing `test:engine` command so full regression runs include V4-A.

- [ ] **Step 6: Run the domain contract test**

Run:

```bash
node --test tests/auryn-v4-domain.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit the domain contract**

```bash
git add lib/auryn/v4/version.ts lib/auryn/v4/domain.ts tsconfig.engine.json package.json tests/auryn-v4-domain.test.mjs
git commit -m "feat: define AURYN V4 analyst domain"
```

---

### Task 2: Build layered security and lifecycle classification

**Files:**
- Create: `lib/auryn/v4/classification.ts`
- Create: `tests/auryn-v4-classification-models.test.mjs`

**Interfaces:**
- Consumes: `SecurityClassification`, `SecurityClassificationInput`, `BusinessModel`, `LifecycleStage`, `EvidenceRef` from `domain.ts`.
- Produces: `classifyV4Security(input: SecurityClassificationInput & {evidence:EvidenceRef[]}): SecurityClassification`.

- [ ] **Step 1: Write failing classifier tests for materially different companies**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {classifyV4Security} from "../.engine-test/auryn/v4/classification.js";

const e=(id,key)=>({id,key,source:"PROVIDER",scope:"POINT_IN_TIME",asOf:"2026-09-07",validationState:"MEASURED"});

test("space frontier company routes to SPACE_SATELLITE and VALIDATION",()=>{
  const x=classifyV4Security({
    assetType:"stock",sector:"Communication Services",industry:"Telecom Services",
    name:"Frontier Satellite",description:"direct-to-device satellite constellation with launch milestones and carrier partners",
    revenue:25,revenueGrowth:140,operatingMargin:-80,fcf:-500,profitable:false,
    evidence:[e("profile","industry"),e("filing","revenue")]
  });
  assert.equal(x.businessModel,"SPACE_SATELLITE");
  assert.ok(["VALIDATION","INFLECTION"].includes(x.lifecycle));
  assert.equal(x.profitabilityStage,"PRE_PROFIT");
  assert.ok(x.confidence>=0.65);
});

test("memory semiconductor is not classified like a software compounder",()=>{
  const x=classifyV4Security({assetType:"stock",sector:"Technology",industry:"Semiconductors",name:"MemoryCo",description:"DRAM and NAND memory producer",revenue:30000,revenueGrowth:55,operatingMargin:18,fcf:2000,profitable:true,evidence:[e("profile","industry")]});
  assert.equal(x.businessModel,"SEMICONDUCTOR_MEMORY_CYCLICAL");
  assert.equal(x.cyclicality,"HIGHLY_CYCLICAL");
});

test("classification confidence stays modest when evidence is generic",()=>{
  const x=classifyV4Security({assetType:"stock",name:"Unknown Corp",description:"technology company",evidence:[]});
  assert.equal(x.businessModel,"GENERAL_COMPOUNDER");
  assert.ok(x.confidence<0.6);
});
```

- [ ] **Step 2: Compile and verify the tests fail because the classifier is absent**

Run:

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-classification-models.test.mjs
```

Expected: TypeScript or module-resolution failure for `classification.ts`.

- [ ] **Step 3: Implement deterministic business-model routing**

Use an explicit ordered classifier so specific business models win before generic sector labels:

```ts
const rules:[BusinessModel,RegExp][]=[
  ["SPACE_SATELLITE",/satellite|constellation|direct[- ]to[- ]device|space[- ]based/],
  ["SEMICONDUCTOR_MEMORY_CYCLICAL",/\bdram\b|\bnand\b|memory semiconductor|memory producer/],
  ["SEMICONDUCTOR_DESIGNER",/fabless|semiconductor design|gpu|accelerator|chip designer/],
  ["NETWORKING_COMPUTE_INFRA",/networking silicon|ethernet|optical interconnect|switching|compute fabric/],
  ["AI_DATA_CENTER_INFRA",/ai cloud|gpu cloud|data cent(?:er|re)|accelerated compute|hyperscale/],
  ["POWER_UTILITY_INFRA",/utility|power generation|fuel cell|grid|electric power/],
  ["MARKETPLACE_ADTECH",/ad[- ]tech|advertising platform|marketplace|app monetization/],
  ["SAAS_SOFTWARE",/saas|software platform|cloud software|subscription software/],
  ["FINTECH_PAYMENTS",/payments|fintech|merchant acquiring|digital wallet/],
  ["BIOTECH_PHARMA",/biotech|pharma|therapeutic|drug development/],
  ["MEDTECH",/medical device|medtech|diagnostic device/],
  ["MINER_COMMODITY",/mining|miner|copper producer|gold producer|lithium producer/],
  ["ENERGY",/oil|gas|lng|upstream|midstream|refining/],
  ["DEFENSE",/defense|aerospace systems|missile|military systems/],
  ["REIT",/\breit\b|real estate investment trust/],
  ["BANK",/\bbank\b|banking/],
  ["INSURER",/insurance|insurer/],
  ["CONSUMER",/consumer|retail|restaurant|beverage|apparel/],
  ["INDUSTRIAL",/industrial|machinery|logistics equipment|automation/]
];
```

Use sector/industry to reinforce, not override, the text match. Map `assetClass` deterministically: ETF first; REIT, financial, biotech, miner next; otherwise equity.

- [ ] **Step 4: Implement lifecycle routing from operating state rather than stock price**

Use these ordered rules:

```ts
function lifecycleOf(x:SecurityClassificationInput,businessModel:BusinessModel):LifecycleStage{
  const rev=finite(x.revenue)?Number(x.revenue):null;
  const growth=finite(x.revenueGrowth)?Number(x.revenueGrowth):null;
  const op=finite(x.operatingMargin)?Number(x.operatingMargin):null;
  const fcf=finite(x.fcf)?Number(x.fcf):null;
  if((rev==null||rev<=0)&&x.profitable===false)return "PRE_COMMERCIAL";
  if(x.profitable===false&&["SPACE_SATELLITE","BIOTECH_PHARMA"].includes(businessModel)&&growth!=null&&growth>40)return "VALIDATION";
  if(growth!=null&&growth>=35&&((op!=null&&op>0)||(fcf!=null&&fcf>0)))return "INFLECTION";
  if(growth!=null&&growth>=30)return "HYPERGROWTH";
  if(growth!=null&&growth>=15&&x.profitable!==false)return "SCALE";
  if(growth!=null&&growth>=7&&x.profitable!==false)return "COMPOUNDER";
  if(growth!=null&&growth<0)return "DECLINE_OR_REINVENTION";
  return "MATURITY";
}
```

No market-price or RSI input is accepted by `SecurityClassificationInput`.

- [ ] **Step 5: Compute classification confidence from independent evidence**

Use additive confidence with a hard cap of `0.98`:

```ts
let confidence=0.30;
if(input.industry)confidence+=0.20;
if(input.sector)confidence+=0.10;
if(specificTextRuleMatched)confidence+=0.20;
if(input.evidence.length>=2)confidence+=0.10;
if(input.revenue!=null||input.profitable!=null)confidence+=0.08;
confidence=Math.min(0.98,confidence);
```

Generic fallback without a specific business-model match must cap at `0.55`.

- [ ] **Step 6: Run the classifier tests**

Run:

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-classification-models.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit classification**

```bash
git add lib/auryn/v4/classification.ts tests/auryn-v4-classification-models.test.mjs
git commit -m "feat: add AURYN V4 security classification"
```

---

### Task 3: Add the first-wave sector/lifecycle analyst model registry

**Files:**
- Create: `lib/auryn/v4/model-registry.ts`
- Modify: `tests/auryn-v4-classification-models.test.mjs`

**Interfaces:**
- Consumes: `SecurityClassification`, `CanonicalFactorKey`.
- Produces: `AnalystModelDefinition`, `ANALYST_MODELS`, `selectAnalystModel(classification)`.

- [ ] **Step 1: Extend the test with model-selection cases**

```js
import {selectAnalystModel} from "../.engine-test/auryn/v4/model-registry.js";

test("model registry selects frontier model for a satellite validation company",()=>{
  const c=classifyV4Security({assetType:"stock",industry:"Telecom Services",description:"direct-to-device satellite constellation",revenue:20,revenueGrowth:100,profitable:false,evidence:[e("p","industry")]});
  const m=selectAnalystModel(c);
  assert.equal(m.definition.id,"frontier-pre-scale");
  assert.ok(m.suitability>=0.65);
});

test("model registry selects memory-cycle model before generic technology",()=>{
  const c=classifyV4Security({assetType:"stock",industry:"Semiconductors",description:"DRAM NAND memory producer",revenue:1000,revenueGrowth:45,profitable:true,evidence:[e("p","industry")]});
  assert.equal(selectAnalystModel(c).definition.id,"semiconductor-memory-cycle");
});
```

- [ ] **Step 2: Run and verify the new tests fail**

Run:

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-classification-models.test.mjs
```

Expected: FAIL because `model-registry.ts` is not implemented.

- [ ] **Step 3: Implement the model definition contract**

```ts
export interface AnalystModelDefinition {
  id:string;
  version:string;
  businessModels:BusinessModel[];
  lifecycle?:LifecycleStage[];
  factorWeights:Partial<Record<CanonicalFactorKey,number>>;
  requiredFactors:CanonicalFactorKey[];
  optionalFactors:CanonicalFactorKey[];
  allowOptionalRenormalization:boolean;
  maxActionWhenSuitabilityLow:PrimaryInvestmentAction;
}
```

`maxActionWhenSuitabilityLow` must be `HOLD` for first-wave models; low suitability must never create conviction.

- [ ] **Step 4: Define the ten first-wave models with exact category weights**

Weights are category weights, not probabilities; each model must total `1.00` across its active factors.

```ts
const common={version:"auryn-v4-model-1",allowOptionalRenormalization:true,maxActionWhenSuitabilityLow:"HOLD" as const};

export const ANALYST_MODELS:AnalystModelDefinition[]=[
  {...common,id:"general-compounder",businessModels:["GENERAL_COMPOUNDER","CONSUMER","INDUSTRIAL"],factorWeights:{BUSINESS_QUALITY:.16,GROWTH_INFLECTION:.12,MOAT:.13,NARRATIVE_EXPECTATIONS:.06,FUNDAMENTALS_EARNINGS:.13,VALUATION:.12,TECHNICALS:.06,POSITIONING:.03,CATALYSTS:.05,SECTOR_INDUSTRY:.06,MACRO_REGIME:.02,RISK:.06},requiredFactors:["BUSINESS_QUALITY","FUNDAMENTALS_EARNINGS","VALUATION","RISK"],optionalFactors:["GROWTH_INFLECTION","MOAT","NARRATIVE_EXPECTATIONS","TECHNICALS","POSITIONING","CATALYSTS","SECTOR_INDUSTRY","MACRO_REGIME"]},
  {...common,id:"software-marketplace",businessModels:["SAAS_SOFTWARE","MARKETPLACE_ADTECH","FINTECH_PAYMENTS"],factorWeights:{BUSINESS_QUALITY:.15,GROWTH_INFLECTION:.16,MOAT:.15,NARRATIVE_EXPECTATIONS:.08,FUNDAMENTALS_EARNINGS:.11,VALUATION:.12,TECHNICALS:.05,POSITIONING:.02,CATALYSTS:.05,SECTOR_INDUSTRY:.04,MACRO_REGIME:.01,RISK:.06},requiredFactors:["BUSINESS_QUALITY","GROWTH_INFLECTION","VALUATION","RISK"],optionalFactors:["MOAT","NARRATIVE_EXPECTATIONS","FUNDAMENTALS_EARNINGS","TECHNICALS","POSITIONING","CATALYSTS","SECTOR_INDUSTRY","MACRO_REGIME"]},
  {...common,id:"semiconductor-designer-networking",businessModels:["SEMICONDUCTOR_DESIGNER","NETWORKING_COMPUTE_INFRA"],factorWeights:{BUSINESS_QUALITY:.12,GROWTH_INFLECTION:.15,MOAT:.16,NARRATIVE_EXPECTATIONS:.07,FUNDAMENTALS_EARNINGS:.11,VALUATION:.10,TECHNICALS:.06,POSITIONING:.03,CATALYSTS:.06,SECTOR_INDUSTRY:.07,MACRO_REGIME:.02,RISK:.05},requiredFactors:["GROWTH_INFLECTION","MOAT","FUNDAMENTALS_EARNINGS","VALUATION","RISK"],optionalFactors:["BUSINESS_QUALITY","NARRATIVE_EXPECTATIONS","TECHNICALS","POSITIONING","CATALYSTS","SECTOR_INDUSTRY","MACRO_REGIME"]},
  {...common,id:"semiconductor-memory-cycle",businessModels:["SEMICONDUCTOR_MEMORY_CYCLICAL"],factorWeights:{BUSINESS_QUALITY:.07,GROWTH_INFLECTION:.17,MOAT:.06,NARRATIVE_EXPECTATIONS:.05,FUNDAMENTALS_EARNINGS:.12,VALUATION:.10,TECHNICALS:.08,POSITIONING:.03,CATALYSTS:.05,SECTOR_INDUSTRY:.15,MACRO_REGIME:.06,RISK:.06},requiredFactors:["GROWTH_INFLECTION","FUNDAMENTALS_EARNINGS","SECTOR_INDUSTRY","VALUATION","RISK"],optionalFactors:["BUSINESS_QUALITY","MOAT","NARRATIVE_EXPECTATIONS","TECHNICALS","POSITIONING","CATALYSTS","MACRO_REGIME"]},
  {...common,id:"ai-power-infrastructure",businessModels:["AI_DATA_CENTER_INFRA","POWER_UTILITY_INFRA"],factorWeights:{BUSINESS_QUALITY:.10,GROWTH_INFLECTION:.15,MOAT:.10,NARRATIVE_EXPECTATIONS:.07,FUNDAMENTALS_EARNINGS:.10,VALUATION:.10,TECHNICALS:.06,POSITIONING:.03,CATALYSTS:.10,SECTOR_INDUSTRY:.07,MACRO_REGIME:.03,RISK:.09},requiredFactors:["GROWTH_INFLECTION","FUNDAMENTALS_EARNINGS","VALUATION","CATALYSTS","RISK"],optionalFactors:["BUSINESS_QUALITY","MOAT","NARRATIVE_EXPECTATIONS","TECHNICALS","POSITIONING","SECTOR_INDUSTRY","MACRO_REGIME"]},
  {...common,id:"frontier-pre-scale",businessModels:["SPACE_SATELLITE"],lifecycle:["PRE_COMMERCIAL","VALIDATION","INFLECTION","HYPERGROWTH"],factorWeights:{BUSINESS_QUALITY:.05,GROWTH_INFLECTION:.15,MOAT:.18,NARRATIVE_EXPECTATIONS:.08,FUNDAMENTALS_EARNINGS:.05,VALUATION:.08,TECHNICALS:.04,POSITIONING:.02,CATALYSTS:.13,SECTOR_INDUSTRY:.05,MACRO_REGIME:.02,RISK:.15},requiredFactors:["MOAT","GROWTH_INFLECTION","CATALYSTS","RISK"],optionalFactors:["BUSINESS_QUALITY","NARRATIVE_EXPECTATIONS","FUNDAMENTALS_EARNINGS","VALUATION","TECHNICALS","POSITIONING","SECTOR_INDUSTRY","MACRO_REGIME"]},
  {...common,id:"financials",businessModels:["BANK","INSURER","FINTECH_PAYMENTS"],factorWeights:{BUSINESS_QUALITY:.16,GROWTH_INFLECTION:.07,MOAT:.08,NARRATIVE_EXPECTATIONS:.04,FUNDAMENTALS_EARNINGS:.17,VALUATION:.15,TECHNICALS:.04,POSITIONING:.02,CATALYSTS:.03,SECTOR_INDUSTRY:.08,MACRO_REGIME:.08,RISK:.08},requiredFactors:["BUSINESS_QUALITY","FUNDAMENTALS_EARNINGS","VALUATION","MACRO_REGIME","RISK"],optionalFactors:["GROWTH_INFLECTION","MOAT","NARRATIVE_EXPECTATIONS","TECHNICALS","POSITIONING","CATALYSTS","SECTOR_INDUSTRY"]},
  {...common,id:"biotech-pre-profit",businessModels:["BIOTECH_PHARMA","MEDTECH"],factorWeights:{BUSINESS_QUALITY:.05,GROWTH_INFLECTION:.08,MOAT:.12,NARRATIVE_EXPECTATIONS:.05,FUNDAMENTALS_EARNINGS:.05,VALUATION:.06,TECHNICALS:.03,POSITIONING:.02,CATALYSTS:.22,SECTOR_INDUSTRY:.05,MACRO_REGIME:.02,RISK:.25},requiredFactors:["CATALYSTS","RISK","MOAT"],optionalFactors:["BUSINESS_QUALITY","GROWTH_INFLECTION","NARRATIVE_EXPECTATIONS","FUNDAMENTALS_EARNINGS","VALUATION","TECHNICALS","POSITIONING","SECTOR_INDUSTRY","MACRO_REGIME"]},
  {...common,id:"reit",businessModels:["REIT"],factorWeights:{BUSINESS_QUALITY:.15,GROWTH_INFLECTION:.06,MOAT:.05,NARRATIVE_EXPECTATIONS:.03,FUNDAMENTALS_EARNINGS:.14,VALUATION:.18,TECHNICALS:.04,POSITIONING:.02,CATALYSTS:.03,SECTOR_INDUSTRY:.09,MACRO_REGIME:.12,RISK:.09},requiredFactors:["BUSINESS_QUALITY","FUNDAMENTALS_EARNINGS","VALUATION","MACRO_REGIME","RISK"],optionalFactors:["GROWTH_INFLECTION","MOAT","NARRATIVE_EXPECTATIONS","TECHNICALS","POSITIONING","CATALYSTS","SECTOR_INDUSTRY"]},
  {...common,id:"energy-miner-cycle",businessModels:["ENERGY","MINER_COMMODITY"],factorWeights:{BUSINESS_QUALITY:.08,GROWTH_INFLECTION:.08,MOAT:.04,NARRATIVE_EXPECTATIONS:.03,FUNDAMENTALS_EARNINGS:.11,VALUATION:.10,TECHNICALS:.06,POSITIONING:.03,CATALYSTS:.05,SECTOR_INDUSTRY:.16,MACRO_REGIME:.12,RISK:.14},requiredFactors:["FUNDAMENTALS_EARNINGS","VALUATION","SECTOR_INDUSTRY","MACRO_REGIME","RISK"],optionalFactors:["BUSINESS_QUALITY","GROWTH_INFLECTION","MOAT","NARRATIVE_EXPECTATIONS","TECHNICALS","POSITIONING","CATALYSTS"]}
];
```

- [ ] **Step 5: Implement deterministic model selection and suitability**

Selection order:

1. Exact `businessModel` match.
2. Lifecycle-specific match preferred over a generic match.
3. If multiple remain, first registry definition wins and a test locks that order.
4. Fallback to `general-compounder` with suitability capped at `0.55`.

Suitability formula:

```ts
const businessMatch=definition.businessModels.includes(c.businessModel)?1:0;
const lifecycleMatch=!definition.lifecycle?0.8:definition.lifecycle.includes(c.lifecycle)?1:0.35;
const suitability=Math.max(0,Math.min(1,c.confidence*.65+businessMatch*.20+lifecycleMatch*.15));
```

- [ ] **Step 6: Run model-selection tests**

Run:

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-classification-models.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit the model registry**

```bash
git add lib/auryn/v4/model-registry.ts tests/auryn-v4-classification-models.test.mjs
git commit -m "feat: add AURYN V4 analyst model registry"
```

---

### Task 4: Implement the evidence-aware master factor framework

**Files:**
- Create: `lib/auryn/v4/factors.ts`
- Create: `tests/auryn-v4-factors.test.mjs`

**Interfaces:**
- Consumes: `FactorObservation[]`, `AnalystModelDefinition`.
- Produces: `evaluateV4Factors(observations, model): FactorEvaluation`.

Define the return contract in `factors.ts`:

```ts
export interface FactorEvaluation {
  assessments:Partial<Record<CanonicalFactorKey,FactorAssessment>>;
  coverage:number;
  missingRequired:CanonicalFactorKey[];
  weightedOverall:number|null;
  slowScore:number|null;
  opportunityScore:number|null;
  riskScore:number|null;
  validationState:MetricValidationState;
}
```

- [ ] **Step 1: Write failing tests for missing evidence and permitted renormalization**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {evaluateV4Factors} from "../.engine-test/auryn/v4/factors.js";

const obs=(factor,score)=>({factor,score,reason:factor,evidenceIds:[`e-${factor}`],validationState:"MEASURED"});
const model={
  id:"test",version:"1",businessModels:["GENERAL_COMPOUNDER"],
  factorWeights:{BUSINESS_QUALITY:.4,FUNDAMENTALS_EARNINGS:.3,VALUATION:.2,TECHNICALS:.1},
  requiredFactors:["BUSINESS_QUALITY","FUNDAMENTALS_EARNINGS","VALUATION"],
  optionalFactors:["TECHNICALS"],allowOptionalRenormalization:true,maxActionWhenSuitabilityLow:"HOLD"
};

test("missing required evidence is reported rather than filled with 50",()=>{
  const x=evaluateV4Factors([obs("BUSINESS_QUALITY",85),obs("VALUATION",70)],model);
  assert.deepEqual(x.missingRequired,["FUNDAMENTALS_EARNINGS"]);
  assert.equal(x.assessments.FUNDAMENTALS_EARNINGS,undefined);
  assert.ok(x.coverage<100);
});

test("missing optional factor renormalizes only over available active weights",()=>{
  const x=evaluateV4Factors([obs("BUSINESS_QUALITY",80),obs("FUNDAMENTALS_EARNINGS",70),obs("VALUATION",60)],model);
  assert.equal(x.missingRequired.length,0);
  assert.equal(Math.round(x.weightedOverall),72);
});
```

- [ ] **Step 2: Run and verify failure**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-factors.test.mjs
```

Expected: FAIL because `factors.ts` is absent.

- [ ] **Step 3: Implement score validation and duplicate resolution**

Rules:

```ts
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const usable=(x:FactorObservation)=>x.score!=null&&Number.isFinite(x.score)&&x.evidenceIds.length>0;
```

If multiple observations exist for one category, choose in this order:

1. `MEASURED`
2. `HEURISTIC`
3. `COLLECTING`
4. `UNAVAILABLE`

For equal validation state, use the observation with more distinct evidence IDs. Never average conflicting observations silently.

Build `assessments` only for usable observations and copy the selected model weight into each `FactorAssessment`. Compute coverage from active model weight:

```ts
const totalWeight=Object.values(model.factorWeights).reduce((s,w)=>s+(w??0),0);
const coveredWeight=Object.entries(model.factorWeights).reduce((s,[key,w])=>s+(assessments[key as CanonicalFactorKey]?.available?(w??0):0),0);
const coverage=totalWeight?Math.round(coveredWeight/totalWeight*100):0;
const missingRequired=model.requiredFactors.filter(key=>!assessments[key]?.available);
const validationState:MetricValidationState=missingRequired.length?"UNAVAILABLE":Object.values(assessments).some(x=>x?.validationState==="HEURISTIC")?"HEURISTIC":Object.values(assessments).some(x=>x?.validationState==="COLLECTING")?"COLLECTING":"MEASURED";
```

- [ ] **Step 4: Implement active-weight renormalization**

```ts
const availableEntries=Object.entries(model.factorWeights).filter(([key])=>assessments[key as CanonicalFactorKey]?.available);
const availableWeight=availableEntries.reduce((s,[,w])=>s+(w??0),0);
const weightedOverall=availableWeight===0?null:availableEntries.reduce((s,[key,w])=>s+(assessments[key as CanonicalFactorKey]!.score??0)*(w??0),0)/availableWeight;
```

Required missing factors are never masked by renormalization; they remain in `missingRequired` and lower `coverage`/suitability.

- [ ] **Step 5: Produce separate slow, opportunity, and risk aggregates**

Use these groupings:

```ts
const slowKeys=["BUSINESS_QUALITY","GROWTH_INFLECTION","MOAT","FUNDAMENTALS_EARNINGS"] as const;
const opportunityKeys=["NARRATIVE_EXPECTATIONS","VALUATION","TECHNICALS","POSITIONING","CATALYSTS","SECTOR_INDUSTRY","MACRO_REGIME"] as const;
```

`RISK` is never mixed into `slowScore`; it is returned as `riskScore` and applied by the decision policy later.

- [ ] **Step 6: Run the factor tests**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-factors.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit the factor framework**

```bash
git add lib/auryn/v4/factors.ts tests/auryn-v4-factors.test.mjs
git commit -m "feat: add evidence-aware V4 factor framework"
```

---

### Task 5: Build moat direction and slow-thesis stability

**Files:**
- Create: `lib/auryn/v4/moat.ts`
- Create: `lib/auryn/v4/thesis.ts`
- Create: `tests/auryn-v4-thesis-moat-narrative.test.mjs`

**Interfaces:**
- Consumes: V4 factor observations/reasons and existing `stabilizeSlowMetric()` from `lib/v65/thesis-stability.ts`.
- Produces: `buildMoatAssessment()` and `buildInvestmentThesis()`.

- [ ] **Step 1: Write failing tests proving price-only inputs cannot mutate slow state**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {buildInvestmentThesis} from "../.engine-test/auryn/v4/thesis.js";
import {buildMoatAssessment} from "../.engine-test/auryn/v4/moat.js";

const reason=(id,text)=>({id,text,evidenceIds:[id]});

test("unchanged slow evidence fingerprint preserves prior thesis strength",()=>{
  const prior={strength:84,evidenceFingerprint:"slow-1",lastMaterialChangeAt:"2026-08-01T00:00:00Z"};
  const x=buildInvestmentThesis({
    slowScore:72,slowEvidenceFingerprint:"slow-1",prior,now:"2026-09-07T18:00:00Z",
    companyState:"Compounder",positive:[reason("e1","durable growth")],negative:[],marketMayBeMissing:[],invalidators:[]
  });
  assert.equal(x.strength,84);
  assert.equal(x.direction,"STABLE");
  assert.equal(x.lastMaterialChangeAt,prior.lastMaterialChangeAt);
});

test("new slow evidence can strengthen thesis",()=>{
  const x=buildInvestmentThesis({
    slowScore:88,slowEvidenceFingerprint:"slow-2",prior:{strength:80,evidenceFingerprint:"slow-1",lastMaterialChangeAt:"2026-08-01T00:00:00Z"},now:"2026-09-07T18:00:00Z",
    companyState:"Inflection",positive:[reason("e2","margin inflection")],negative:[],marketMayBeMissing:[],invalidators:[]
  });
  assert.equal(x.direction,"STRENGTHENING");
  assert.equal(x.directionDelta,8);
});

test("moat direction is UNKNOWN when moat evidence is absent",()=>{
  const x=buildMoatAssessment({signals:[],prior:undefined,evidenceFingerprint:"none",now:"2026-09-07T18:00:00Z",drivers:[],threats:[]});
  assert.equal(x.score,null);
  assert.equal(x.direction,"UNKNOWN");
});
```

- [ ] **Step 2: Run and verify failure**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-thesis-moat-narrative.test.mjs
```

Expected: FAIL because `thesis.ts` and `moat.ts` are absent.

- [ ] **Step 3: Implement moat scoring only over available moat signals**

```ts
export function buildMoatAssessment(input:BuildMoatInput):MoatAssessment{
  const usable=input.signals.filter(x=>x.score!=null&&Number.isFinite(x.score)&&x.evidenceIds.length>0);
  if(!usable.length)return{score:null,direction:"UNKNOWN",delta:null,drivers:input.drivers,threats:input.threats};
  const candidate=Math.round(usable.reduce((s,x)=>s+Number(x.score),0)/usable.length);
  if(input.prior&&input.prior.evidenceFingerprint===input.evidenceFingerprint){
    return{score:input.prior.score,direction:"STABLE",delta:0,drivers:input.drivers,threats:input.threats};
  }
  const delta=input.prior==null?null:candidate-input.prior.score;
  const direction=delta==null?"STABLE":delta>=4?"EXPANDING":delta<=-4?"ERODING":"STABLE";
  return{score:candidate,direction,delta,drivers:input.drivers,threats:input.threats};
}
```

Do not substitute `50` when moat data is unavailable.

- [ ] **Step 4: Implement thesis stabilization using the existing V65 invariant**

Call `stabilizeSlowMetric()` with only `slowEvidenceFingerprint`. Missing slow evidence stays missing rather than becoming a synthetic zero:

```ts
if(input.slowScore==null){
  return{strength:input.prior?.strength??null,direction:"STABLE",directionDelta:null,companyState:input.companyState,whyItCanWin:input.positive,marketMayBeMissing:input.marketMayBeMissing,strengtheningEvidence:[],weakeningEvidence:input.negative,invalidationConditions:input.invalidators,evidenceFingerprint:input.slowEvidenceFingerprint,lastMaterialChangeAt:input.prior?.lastMaterialChangeAt??input.now};
}
const stable=stabilizeSlowMetric(
  input.prior?{value:input.prior.strength,evidenceFingerprint:input.prior.evidenceFingerprint,lastMeaningfulChangeAt:input.prior.lastMaterialChangeAt}:undefined,
  {candidateValue:Math.round(input.slowScore),evidenceFingerprint:input.slowEvidenceFingerprint,now:input.now,changedBecause:[...input.positive,...input.negative].map(x=>x.text)}
);
const delta=stable.value-(input.prior?.strength??stable.value);
const direction=stable.value<30?"BROKEN":delta>=5?"STRENGTHENING":delta<=-5?"WEAKENING":"STABLE";
```

Return positive reasons as `whyItCanWin` / `strengtheningEvidence`, negative reasons as `weakeningEvidence`, and preserve explicit invalidators.

- [ ] **Step 5: Run the slow-state tests**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-thesis-moat-narrative.test.mjs
```

Expected: thesis/moat tests PASS; narrative tests are added next.

- [ ] **Step 6: Commit slow thesis and moat**

```bash
git add lib/auryn/v4/moat.ts lib/auryn/v4/thesis.ts tests/auryn-v4-thesis-moat-narrative.test.mjs
git commit -m "feat: stabilize V4 thesis and moat state"
```

---

### Task 6: Add evidence-bounded narrative and contrarian-edge state

**Files:**
- Create: `lib/auryn/v4/narrative.ts`
- Modify: `tests/auryn-v4-thesis-moat-narrative.test.mjs`

**Interfaces:**
- Consumes: explicit `EvidenceBackedReason[]` and numeric `expectationGapScore` from normalized evidence.
- Produces: `buildNarrativeAssessment()`.

- [ ] **Step 1: Add failing provenance tests**

```js
import {buildNarrativeAssessment} from "../.engine-test/auryn/v4/narrative.js";

test("contrarian edge requires cited evidence",()=>{
  const x=buildNarrativeAssessment({market:[],auryn:[],expectationGapScore:80});
  assert.equal(x.contrarianEdge.state,"NO_DEFENSIBLE_EDGE");
  assert.equal(x.contrarianEdge.reason,null);
});

test("positive edge is allowed only when AURYN thesis contains evidence IDs",()=>{
  const x=buildNarrativeAssessment({market:[reason("m1","market expects mature growth")],auryn:[reason("a1","new product expands TAM")],expectationGapScore:76});
  assert.equal(x.contrarianEdge.state,"POSITIVE_EDGE");
  assert.deepEqual(x.contrarianEdge.reason.evidenceIds,["a1"]);
});
```

- [ ] **Step 2: Run and verify the narrative tests fail**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-thesis-moat-narrative.test.mjs
```

Expected: FAIL because `narrative.ts` is absent.

- [ ] **Step 3: Implement the contrarian-edge policy**

```ts
export function buildNarrativeAssessment(input:BuildNarrativeInput):NarrativeAssessment{
  const cited=input.auryn.filter(r=>r.evidenceIds.length>0);
  let state:NarrativeAssessment["contrarianEdge"]["state"]="NO_DEFENSIBLE_EDGE";
  if(cited.length&&input.expectationGapScore!=null){
    state=input.expectationGapScore>=65?"POSITIVE_EDGE":input.expectationGapScore<=35?"NEGATIVE_EDGE":"CONSENSUS_ALIGNED";
  }
  return{
    marketNarrative:input.market.filter(r=>r.evidenceIds.length>0),
    aurynThesis:cited,
    contrarianEdge:{state,reason:state==="NO_DEFENSIBLE_EDGE"?null:cited[0]??null}
  };
}
```

No prose-generation API is called in V4-A.

- [ ] **Step 4: Run thesis/moat/narrative tests**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-thesis-moat-narrative.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit narrative logic**

```bash
git add lib/auryn/v4/narrative.ts tests/auryn-v4-thesis-moat-narrative.test.mjs
git commit -m "feat: add evidence-bounded V4 narrative state"
```

---

### Task 7: Implement decision confidence without pretending it is probability

**Files:**
- Create: `lib/auryn/v4/confidence.ts`
- Create: `tests/auryn-v4-decision.test.mjs`

**Interfaces:**
- Produces: `buildDecisionConfidence(input): DecisionConfidence`.
- Consumes only process-quality dimensions; it accepts no realized-return or target-hit field.

- [ ] **Step 1: Create failing confidence tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {buildDecisionConfidence} from "../.engine-test/auryn/v4/confidence.js";

test("confidence falls when model suitability and coverage are weak",()=>{
  const hi=buildDecisionConfidence({coverage:90,freshness:90,sourceQuality:90,modelSuitability:90,agreement:80,validationState:"MEASURED"});
  const lo=buildDecisionConfidence({coverage:45,freshness:70,sourceQuality:60,modelSuitability:40,agreement:50,validationState:"HEURISTIC"});
  assert.ok(hi.score>lo.score);
  assert.equal(hi.label,"HIGH");
  assert.equal(lo.label,"LOW");
});
```

- [ ] **Step 2: Run and verify failure**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-decision.test.mjs
```

Expected: FAIL because `confidence.ts` is absent.

- [ ] **Step 3: Implement transparent confidence weighting**

```ts
const score=Math.round(
  input.coverage*.28+
  input.freshness*.14+
  input.sourceQuality*.18+
  input.modelSuitability*.22+
  input.agreement*.18
);
const label=score>=78?"HIGH":score>=58?"MEDIUM":"LOW";
```

If `validationState` is `HEURISTIC`, cap score at `74`. If `COLLECTING`, cap at `59`. If `UNAVAILABLE`, cap at `39`.

Also export evidence-quality helpers used by the orchestrator:

```ts
export const sourceQuality=(source:string)=>source==="SEC"?100:source==="ISSUER"?90:source==="PROVIDER"?75:60;

export function evidenceFreshness(asOf:string,evidenceAsOf:string|null,scope:string){
  if(!evidenceAsOf)return 35;
  const ageDays=Math.max(0,(Date.parse(asOf)-Date.parse(evidenceAsOf))/86400000);
  if(!Number.isFinite(ageDays))return 35;
  if(scope==="ANNUAL")return ageDays<=450?90:ageDays<=550?65:40;
  if(scope==="QUARTER"||scope==="TTM")return ageDays<=120?90:ageDays<=180?70:45;
  return ageDays<=2?95:ageDays<=7?80:ageDays<=30?60:35;
}
```

- [ ] **Step 4: Run the confidence test**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-decision.test.mjs
```

Expected: confidence test PASS; action tests are added next.

- [ ] **Step 5: Commit confidence semantics**

```bash
git add lib/auryn/v4/confidence.ts tests/auryn-v4-decision.test.mjs
git commit -m "feat: add V4 decision confidence semantics"
```

---

### Task 8: Build the deterministic multi-horizon action resolver

**Files:**
- Create: `lib/auryn/v4/decision.ts`
- Modify: `tests/auryn-v4-decision.test.mjs`

**Interfaces:**
- Consumes: classification/model suitability, factor evaluation, thesis, moat, confidence, hard veto codes, soft constraint codes.
- Produces: `resolveV4Decision(input: ResolveV4DecisionInput): ResolveV4DecisionResult`.

Use these exact internal contracts:

```ts
export interface ResolveV4DecisionInput {
  businessModel:BusinessModel;
  slowScore:number|null;
  opportunityScore:number|null;
  riskScore:number|null;
  technicalScore:number|null;
  valuationScore:number|null;
  catalystScore:number|null;
  sectorScore:number|null;
  thesis:Pick<InvestmentThesis,"strength"|"direction">;
  moat:Pick<MoatAssessment,"score"|"direction">;
  confidence:DecisionConfidence;
  missingRequired:CanonicalFactorKey[];
  hardVetoes:string[];
  softConstraints:string[];
  modelSuitability:number;
}

export interface ResolveV4DecisionResult {
  primaryAction:PrimaryInvestmentAction;
  horizonDecisions:HorizonDecision[];
  reasonCodes:string[];
}
```

- [ ] **Step 1: Add failing tests for decisive actions and horizon conflict**

```js
import {resolveV4Decision} from "../.engine-test/auryn/v4/decision.js";

const confidence={score:82,label:"HIGH",coverage:90,freshness:90,sourceQuality:90,modelSuitability:85,agreement:80,validationState:"MEASURED"};
const base={
  slowScore:90,opportunityScore:84,riskScore:35,technicalScore:82,valuationScore:80,catalystScore:80,sectorScore:80,
  thesis:{strength:90,direction:"STABLE"},moat:{score:90,direction:"STABLE"},confidence,
  missingRequired:[],hardVetoes:[],softConstraints:[],modelSuitability:.85
};

test("strong evidence can produce STRONG_BUY without WAIT",()=>{
  const x=resolveV4Decision(base);
  assert.equal(x.primaryAction,"STRONG_BUY");
  assert.ok(x.horizonDecisions.every(h=>h.action!=="INSUFFICIENT_EVIDENCE"));
  assert.ok(!x.horizonDecisions.some(h=>String(h.action).includes("WAIT")));
});

test("weak technicals can constrain NOW while long-term remains BUY",()=>{
  const x=resolveV4Decision({...base,technicalScore:28,softConstraints:["TECHNICAL_INSTABILITY"]});
  assert.equal(x.primaryAction,"BUY");
  assert.equal(x.horizonDecisions.find(h=>h.horizon==="NOW").action,"HOLD");
  assert.ok(["BUY","STRONG_BUY"].includes(x.horizonDecisions.find(h=>h.horizon==="THREE_TO_FIVE_YEARS").action));
});

test("broken thesis sells even when valuation looks cheap",()=>{
  const x=resolveV4Decision({...base,slowScore:28,valuationScore:92,thesis:{strength:28,direction:"BROKEN"}});
  assert.equal(x.primaryAction,"SELL");
});

test("missing required evidence produces INSUFFICIENT_EVIDENCE instead of neutral HOLD",()=>{
  const x=resolveV4Decision({...base,missingRequired:["FUNDAMENTALS_EARNINGS"]});
  assert.equal(x.primaryAction,"INSUFFICIENT_EVIDENCE");
});
```

- [ ] **Step 2: Run and verify the action tests fail**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-decision.test.mjs
```

Expected: FAIL because `decision.ts` is absent.

- [ ] **Step 3: Implement deterministic helper functions and hard-veto precedence**

Use these helpers so every early return still contains four horizon decisions and reason codes:

```ts
const HORIZONS:Horizon[]=["NOW","SWING","SIX_TO_TWELVE_MONTHS","THREE_TO_FIVE_YEARS"];
const weighted=(parts:Array<[number|null,number]>)=>{
  const usable=parts.filter(([v,w])=>v!=null&&Number.isFinite(v)&&w>0) as Array<[number,number]>;
  const w=usable.reduce((s,[,weight])=>s+weight,0);
  return w?usable.reduce((s,[v,weight])=>s+v*weight,0)/w:50;
};
const actionFromScore=(score:number):PrimaryInvestmentAction=>score>=80?"STRONG_BUY":score>=66?"BUY":score>=50?"HOLD":score>=35?"REDUCE":"SELL";
const fixed=(action:PrimaryInvestmentAction,confidence:DecisionConfidence,reason:string):ResolveV4DecisionResult=>({
  primaryAction:action,reasonCodes:[reason],horizonDecisions:HORIZONS.map(horizon=>({horizon,action,confidence,reasonCodes:[reason]}))
});
const insufficient=(reason:string)=>fixed("INSUFFICIENT_EVIDENCE",input.confidence,reason);
const sellAll=(reason:string)=>fixed("SELL",input.confidence,reason);
```

Use this exact precedence before numeric thresholds:

```ts
if(input.missingRequired.length||input.modelSuitability<.40||input.thesis.strength==null||input.slowScore==null||input.riskScore==null)return insufficient("CRITICAL_EVIDENCE_MISSING");
if(input.hardVetoes.includes("FRAUD_OR_GOVERNANCE_FAILURE"))return sellAll("HARD_VETO_GOVERNANCE");
if(input.hardVetoes.includes("SOLVENCY_OR_FINANCING_FAILURE"))return sellAll("HARD_VETO_SOLVENCY");
if(input.thesis.direction==="BROKEN"||input.thesis.strength<30)return sellAll("THESIS_BROKEN");
```

`HOLD` must never override a hard veto.

- [ ] **Step 4: Implement horizon-specific scorecards without averaging horizons together**

Use separate formulas:

```ts
const nowScore=weighted([
  [input.technicalScore,.45],[input.catalystScore,.20],[input.sectorScore,.15],[input.riskScore==null?null:100-input.riskScore,.20]
]);
const swingScore=weighted([
  [input.technicalScore,.30],[input.opportunityScore,.25],[input.catalystScore,.15],[input.slowScore,.20],[input.riskScore==null?null:100-input.riskScore,.10]
]);
const mediumScore=weighted([
  [input.slowScore,.40],[input.valuationScore,.20],[input.opportunityScore,.20],[input.sectorScore,.10],[input.riskScore==null?null:100-input.riskScore,.10]
]);
const longScore=weighted([
  [input.slowScore,.50],[input.moat.score,.20],[input.valuationScore,.15],[input.opportunityScore,.10],[input.riskScore==null?null:100-input.riskScore,.05]
]);
```

Null inputs are renormalized over available terms; required-factor missingness has already been handled before this point.

- [ ] **Step 5: Map scorecards to actions with risk/thesis guards**

Use the `actionFromScore()` helper from Step 3 for each horizon, then apply guards:

- `riskScore >= 85` caps any buy action at `HOLD`.
- `thesis.direction === "WEAKENING"` caps `STRONG_BUY` at `BUY` and caps `BUY` at `HOLD` when `thesis.strength < 58`.
- `modelSuitability < .60` caps any `STRONG_BUY` at `BUY` and any `BUY` at `HOLD`.
- `TECHNICAL_INSTABILITY` caps `NOW` and `SWING` buy actions at `HOLD`; it does not alter medium/long actions, but it caps headline `STRONG_BUY` at `BUY` so entry sizing remains staged.
- `EXTREME_VALUATION` caps medium and primary actions at `HOLD`; long-term may remain `BUY` only if `slowScore >= 85`, `moat.score >= 80`, and `riskScore != null && riskScore < 65`.
- `NEAR_BINARY_EVENT` caps `NOW` at `HOLD` unless the business model is `BIOTECH_PHARMA`, in which case `RISK` and `CATALYSTS` already carry model-specific weight and no automatic upgrade is allowed.

Implement those rules in one pure helper:

```ts
function applyHorizonGuards(horizon:Horizon,action:PrimaryInvestmentAction,input:ResolveV4DecisionInput){
  let out=action;
  const buy=(a:PrimaryInvestmentAction)=>a==="BUY"||a==="STRONG_BUY";
  if(input.riskScore!=null&&input.riskScore>=85&&buy(out))out="HOLD";
  if(input.thesis.direction==="WEAKENING"&&out==="STRONG_BUY")out="BUY";
  if(input.thesis.direction==="WEAKENING"&&input.thesis.strength!=null&&input.thesis.strength<58&&out==="BUY")out="HOLD";
  if(input.modelSuitability<.60&&out==="STRONG_BUY")out="BUY";
  if(input.modelSuitability<.60&&out==="BUY")out="HOLD";
  if(input.softConstraints.includes("TECHNICAL_INSTABILITY")&&(horizon==="NOW"||horizon==="SWING")&&buy(out))out="HOLD";
  if(input.softConstraints.includes("EXTREME_VALUATION")&&horizon==="SIX_TO_TWELVE_MONTHS"&&buy(out))out="HOLD";
  if(input.softConstraints.includes("NEAR_BINARY_EVENT")&&horizon==="NOW"&&input.businessModel!=="BIOTECH_PHARMA"&&buy(out))out="HOLD";
  return out;
}
```

- [ ] **Step 6: Synthesize the headline investment action from medium/long truth, not from NOW alone**

Policy:

```ts
const scoreByHorizon={NOW:nowScore,SWING:swingScore,SIX_TO_TWELVE_MONTHS:mediumScore,THREE_TO_FIVE_YEARS:longScore};
const guardedByHorizon=Object.fromEntries(HORIZONS.map(h=>[h,applyHorizonGuards(h,actionFromScore(scoreByHorizon[h]),input)])) as Record<Horizon,PrimaryInvestmentAction>;
const actionFor=(h:Horizon)=>guardedByHorizon[h];
const medium=actionFor("SIX_TO_TWELVE_MONTHS");
const long=actionFor("THREE_TO_FIVE_YEARS");
let primary=medium;
if(medium==="STRONG_BUY"&&long==="STRONG_BUY")primary="STRONG_BUY";
else if(["BUY","STRONG_BUY"].includes(medium)&&["BUY","STRONG_BUY"].includes(long))primary="BUY";
else if(medium==="SELL"||long==="SELL")primary=input.thesis.direction==="BROKEN"?"SELL":"REDUCE";
else if(medium==="REDUCE"||long==="REDUCE")primary="REDUCE";
else primary="HOLD";
```

Apply headline caps after synthesis with explicit logic:

```ts
if(input.softConstraints.includes("TECHNICAL_INSTABILITY")&&primary==="STRONG_BUY")primary="BUY";
if(input.softConstraints.includes("EXTREME_VALUATION")&&(primary==="BUY"||primary==="STRONG_BUY"))primary="HOLD";
if(input.riskScore!=null&&input.riskScore>=85&&(primary==="BUY"||primary==="STRONG_BUY"))primary="HOLD";
if(input.modelSuitability<.60&&(primary==="BUY"||primary==="STRONG_BUY"))primary="HOLD";
```

For the long-horizon exception under `EXTREME_VALUATION`, allow `THREE_TO_FIVE_YEARS` to remain `BUY` only when `slowScore >= 85`, `moat.score != null && moat.score >= 80`, and `riskScore != null && riskScore < 65`; otherwise cap that horizon to `HOLD` too.

Build reason codes deterministically from triggered facts: `LONG_TERM_THESIS_STRONG`, `TECHNICAL_WEAKNESS_LIMITS_TIMING`, `VALUATION_CAPS_NEW_RISK`, `THESIS_BROKEN`, `CRITICAL_EVIDENCE_MISSING`, `RISK_CAP_ACTIVE`, and `MODEL_SUITABILITY_CAP`.

- [ ] **Step 7: Run decision tests**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-decision.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit the action resolver**

```bash
git add lib/auryn/v4/decision.ts tests/auryn-v4-decision.test.mjs
git commit -m "feat: add decisive V4 multi-horizon policy"
```

---

### Task 9: Add the current-evidence migration adapter and V4-A orchestration entry point

**Files:**
- Create: `lib/auryn/v4/current-evidence-adapter.ts`
- Create: `lib/auryn/v4/analyze.ts`
- Modify: `tests/auryn-v4-factors.test.mjs`

**Interfaces:**
- Produces: `adaptCurrentEvidenceToV4(input): AnalystEvidenceBundle`.
- Produces: `buildAurynV4CoreAnalysis(bundle): AurynV4CoreAnalysis`.
- The adapter is migration-only; `analyze.ts` does not import React or stock-page code.

- [ ] **Step 1: Add failing adapter tests that preserve missing-data honesty**

```js
import {adaptCurrentEvidenceToV4} from "../.engine-test/auryn/v4/current-evidence-adapter.js";

test("legacy adapter does not manufacture moat or positioning scores",()=>{
  const x=adaptCurrentEvidenceToV4({
    symbol:"APP",asOf:"2026-09-07T18:00:00Z",
    market:{scores:{trend:45,momentum:40,flow:50,risk:55}},
    company:{rawMetrics:{revGrowth:30,opMargin:25,fcf:10,leverage:30},fundamentalSignal:{currentScore:86},fiveYearRecord:{score:84}},
    context:{profile:{finnhubIndustry:"Software",description:"software advertising platform"},surprises:[{surprisePercent:8}]},
    legacyDecision:{valuationLabel:"Fair",timing:{score:42},factors:{catalysts:60,risk:55}}
  });
  assert.equal(x.observations.some(o=>o.factor==="MOAT"),false);
  assert.equal(x.observations.some(o=>o.factor==="POSITIONING"),false);
});
```

- [ ] **Step 2: Run and verify failure**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-factors.test.mjs
```

Expected: FAIL because the adapter is absent.

- [ ] **Step 3: Implement explicit migration mappings with validation labels**

Map only evidence the current engine can actually support:

```ts
// BUSINESS_QUALITY: currentScore + fiveYearRecord + operating/cash quality; HEURISTIC until raw metric proof is complete.
// GROWTH_INFLECTION: annual revenue growth + latest-quarter growth/surprises when present.
// FUNDAMENTALS_EARNINGS: operating margin + FCF + leverage + earnings surprise when present.
// VALUATION: translate legacy valuation label only as HEURISTIC: Deeply attractive=85, Attractive=72, Fair=55, Expensive=30; Unclear => omit.
// TECHNICALS: use existing timing score as MEASURED/HEURISTIC according to source contract.
// CATALYSTS: use legacy catalyst score only when source-backed context news/guidance exists.
// SECTOR_INDUSTRY: omit unless current context supplies an explicit sector/regime score.
// MACRO_REGIME: omit unless current market object supplies a measured regime score.
// RISK: use existing risk score when finite.
// MOAT, NARRATIVE_EXPECTATIONS, POSITIONING: omit unless explicit evidence is supplied; never default to 50.
```

Every emitted observation must contain at least one synthetic-but-traceable migration evidence ID such as `legacy:company:fundamentalSignal`, `legacy:market:timing`, or a real source ID when present. Build matching refs with one helper:

```ts
const ref=(id:string,key:string,scope:EvidenceScope="POINT_IN_TIME",source:EvidenceSource="DERIVED"):EvidenceRef=>({id,key,scope,source,asOf:input.asOf,validationState:"HEURISTIC"});
```

The adapter must always initialize `evidenceConflicts:[]`, `moatSignals:[]`, `moatReasons:{drivers:[],threats:[]}`, and empty narrative/thesis reason arrays unless current source-backed evidence can populate them.

- [ ] **Step 4: Build a slow-evidence fingerprint that excludes market/technical values**

Create the fingerprint from sorted slow source/value keys only:

```ts
const slowFingerprint=JSON.stringify({
  currentScore:company?.fundamentalSignal?.currentScore??null,
  recordScore:company?.fiveYearRecord?.score??null,
  revGrowth:raw?.revGrowth??null,
  opMargin:raw?.opMargin??null,
  fcf:raw?.fcf??null,
  leverage:raw?.leverage??null,
  latestQuarter:company?.latestQuarter??null,
  guidance:context?.guidance??company?.guidance??null
});
```

Do not include price, RSI, trend, momentum, flow, support, resistance, or timing score.

- [ ] **Step 5: Implement the V4-A orchestrator in a fixed order**

`buildAurynV4CoreAnalysis(bundle)` must execute:

```ts
const classification=classifyV4Security({...bundle.classificationInput,evidence:bundle.evidenceRefs});
const selected=selectAnalystModel(classification);
const factorResult=evaluateV4Factors(bundle.observations,selected.definition);
const moatFingerprint=JSON.stringify(bundle.moatSignals.map(x=>[x.factor,x.score,[...x.evidenceIds].sort()]));
const moat=buildMoatAssessment({signals:bundle.moatSignals,prior:bundle.priorMoat,evidenceFingerprint:moatFingerprint,now:bundle.asOf,drivers:bundle.moatReasons.drivers,threats:bundle.moatReasons.threats});
const thesis=buildInvestmentThesis({slowScore:factorResult.slowScore,slowEvidenceFingerprint:bundle.slowEvidenceFingerprint,prior:bundle.priorThesis,now:bundle.asOf,companyState:`${classification.businessModel} · ${classification.lifecycle}`,positive:bundle.thesisReasons.positive,negative:bundle.thesisReasons.negative,marketMayBeMissing:bundle.thesisReasons.marketMayBeMissing,invalidators:bundle.thesisInvalidators});
const narrative=buildNarrativeAssessment(bundle.narrative);
const sourceQualityScore=bundle.evidenceRefs.length?bundle.evidenceRefs.reduce((s,e)=>s+sourceQuality(e.source),0)/bundle.evidenceRefs.length:35;
const freshnessScore=bundle.evidenceRefs.length?bundle.evidenceRefs.reduce((s,e)=>s+evidenceFreshness(bundle.asOf,e.asOf,e.scope),0)/bundle.evidenceRefs.length:35;
const agreementScore=Math.max(40,100-bundle.evidenceConflicts.length*20);
const confidence=buildDecisionConfidence({coverage:factorResult.coverage,freshness:freshnessScore,sourceQuality:sourceQualityScore,modelSuitability:selected.suitability*100,agreement:agreementScore,validationState:factorResult.validationState});
const score=(key:CanonicalFactorKey)=>factorResult.assessments[key]?.score??null;
const decision=resolveV4Decision({businessModel:classification.businessModel,slowScore:factorResult.slowScore,opportunityScore:factorResult.opportunityScore,riskScore:factorResult.riskScore,technicalScore:score("TECHNICALS"),valuationScore:score("VALUATION"),catalystScore:score("CATALYSTS"),sectorScore:score("SECTOR_INDUSTRY"),thesis,moat,confidence,missingRequired:factorResult.missingRequired,hardVetoes:bundle.hardVetoes,softConstraints:bundle.softConstraints,modelSuitability:selected.suitability});
return {version:"auryn-v4",engineVersion:AURYN_V4_ENGINE_VERSION,symbol:bundle.symbol,classification,analystModel:{id:selected.definition.id,version:selected.definition.version,suitability:selected.suitability},factors:factorResult.assessments,thesis,moat,narrative,primaryAction:decision.primaryAction,horizonDecisions:decision.horizonDecisions,confidence,reasonCodes:decision.reasonCodes};
```

Import `sourceQuality` and `evidenceFreshness` from `confidence.ts`. No call to `deriveV65Actions()` or `deriveTodayAction()` is allowed inside V4 modules.

- [ ] **Step 6: Run adapter/factor tests**

```bash
rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v4-factors.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit the migration adapter and orchestrator**

```bash
git add lib/auryn/v4/current-evidence-adapter.ts lib/auryn/v4/analyze.ts tests/auryn-v4-factors.test.mjs
git commit -m "feat: add V4 core orchestration adapter"
```

---

### Task 10: Lock behavior with golden-company cases

**Files:**
- Create: `tests/auryn-v4-golden-companies.test.mjs`
- Modify: `tests/auryn-v4-decision.test.mjs` if reason-code coverage needs an assertion exposed by the final implementation.

**Interfaces:**
- Consumes: `buildAurynV4CoreAnalysis()` and normalized `AnalystEvidenceBundle` fixtures.
- Produces no production code unless a golden case reveals a policy defect; any policy change must be made in the responsible V4 module and re-tested there first.

- [ ] **Step 1: Add a small fixture builder that always uses explicit evidence**

```js
const reason=(id,text)=>({id,text,evidenceIds:[id]});
const observation=(factor,score,state="MEASURED")=>({factor,score,reason:factor,evidenceIds:[`e:${factor}`],validationState:state});
const bundle=(over={})=>({
  symbol:"TEST",asOf:"2026-09-07T18:00:00Z",
  classificationInput:{assetType:"stock",sector:"Technology",industry:"Software",description:"subscription software platform",revenue:1000,revenueGrowth:25,operatingMargin:22,fcf:150,profitable:true},
  evidenceRefs:[{id:"profile",key:"profile",source:"PROVIDER",scope:"POINT_IN_TIME",asOf:"2026-09-07",validationState:"MEASURED"}],
  evidenceConflicts:[],
  observations:[observation("BUSINESS_QUALITY",85),observation("GROWTH_INFLECTION",78),observation("MOAT",82),observation("NARRATIVE_EXPECTATIONS",65),observation("FUNDAMENTALS_EARNINGS",84),observation("VALUATION",68),observation("TECHNICALS",70),observation("CATALYSTS",65),observation("SECTOR_INDUSTRY",70),observation("RISK",40)],
  moatSignals:[observation("MOAT",82)],moatReasons:{drivers:[reason("moat1","switching costs are strengthening")],threats:[]},slowEvidenceFingerprint:"slow-1",
  narrative:{market:[reason("m1","market expects steady growth")],auryn:[reason("a1","new product expands the addressable market")],expectationGapScore:68},
  thesisReasons:{positive:[reason("p1","durable growth and cash generation")],negative:[],marketMayBeMissing:[reason("a1","new product expands the addressable market")]},
  thesisInvalidators:["Revenue growth falls below 10% for two reported quarters"],hardVetoes:[],softConstraints:[],...over
});
```

- [ ] **Step 2: Add the high-quality compounder / weak-technicals case**

```js
test("great company with weak technicals stays an investment BUY while NOW is HOLD",()=>{
  const b=bundle({observations:bundle().observations.map(o=>o.factor==="TECHNICALS"?{...o,score:25}:o),softConstraints:["TECHNICAL_INSTABILITY"]});
  const x=buildAurynV4CoreAnalysis(b);
  assert.equal(x.primaryAction,"BUY");
  assert.equal(x.horizonDecisions.find(h=>h.horizon==="NOW").action,"HOLD");
  assert.ok(["BUY","STRONG_BUY"].includes(x.horizonDecisions.find(h=>h.horizon==="THREE_TO_FIVE_YEARS").action));
});
```

- [ ] **Step 3: Add the frontier/asymmetric case**

Use a `SPACE_SATELLITE`/`VALIDATION` bundle with conventional business/fundamental scores `35–45`, moat `88`, growth/validation `82`, catalysts `90`, risk `72`, valuation `60`, and explicit carrier/technology evidence. Assert:

```js
assert.equal(x.classification.businessModel,"SPACE_SATELLITE");
assert.equal(x.analystModel.id,"frontier-pre-scale");
assert.equal(x.primaryAction,"BUY");
assert.notEqual(x.primaryAction,"STRONG_BUY");
```

This proves the model can recognize asymmetry without pretending the risk disappeared.

- [ ] **Step 4: Add the semiconductor-cycle inflection case**

Use memory-company evidence with growth inflection `85`, sector cycle `88`, fundamentals `72`, valuation `70`, technicals `68`, risk `55`. Assert model `semiconductor-memory-cycle` and primary `BUY`.

- [ ] **Step 5: Add technically strong / deteriorating-business case**

Use technicals `94` but business `38`, fundamentals `40`, growth `35`, thesis prior `70` with a new slow fingerprint driving current slow score below `45`. Assert primary `REDUCE`; if thesis strength falls below `30`, assert `SELL`. The technical score must not rescue the long-horizon action.

- [ ] **Step 6: Add excellent-company / extreme-valuation case**

Use business/moat/fundamentals `88+`, valuation `20`, and soft constraint `EXTREME_VALUATION`. Assert primary `HOLD` and long-term action may be `BUY` only when the exact strong-thesis/moat guard in Task 8 is satisfied.

- [ ] **Step 7: Add broken-thesis / cheap-price case**

Use thesis strength below `30`, valuation `92`, and technicals `75`. Assert primary `SELL` with reason code `THESIS_BROKEN`.

- [ ] **Step 8: Add insufficient-critical-evidence case**

Remove one required factor for the selected model. Assert primary `INSUFFICIENT_EVIDENCE`, not `HOLD`, and assert the missing factor is visible in the resolver's reason path.

- [ ] **Step 9: Run all V4-A tests**

```bash
npm run test:v4-core
```

Expected: all six V4-A test files PASS.

- [ ] **Step 10: Commit golden behavior**

```bash
git add tests/auryn-v4-golden-companies.test.mjs tests/auryn-v4-decision.test.mjs lib/auryn/v4
git commit -m "test: lock AURYN V4 golden decisions"
```

---

### Task 11: Run full regression and production build gates

**Files:**
- Modify only if a regression reveals a V4-A integration defect. Do not change legacy behavior merely to make a V4 assertion pass.

**Interfaces:**
- Verifies: V4-A is additive, compile-safe, and does not change V65 production output.

- [ ] **Step 1: Run the complete engine regression suite**

```bash
npm run test:engine
```

Expected: all existing V54–V65 tests plus the six V4-A tests PASS.

- [ ] **Step 2: Run the production Next.js build**

```bash
npm run build
```

Expected: exit code `0`; no TypeScript compilation errors.

- [ ] **Step 3: Run existing V65 audit**

```bash
npm run audit:v65
```

Expected: audit exits successfully and does not report V4 as an unauthorized replacement of V65 live paths.

- [ ] **Step 4: Verify V4-A is not wired into production UI yet**

Run:

```bash
rg -n "buildAurynV4CoreAnalysis|auryn/v4" app components lib/nivora-investor.ts lib/v65 --glob '!lib/auryn/v4/**'
```

Expected: no stock-page/product-surface invocation of `buildAurynV4CoreAnalysis`; only test/config/import references allowed. This proves V4-A cannot silently change live calls before V4-B.

- [ ] **Step 5: Verify forbidden V4 decision states are absent**

Run:

```bash
rg -n "WAIT_FOR_CONFIRMATION|profitProbability|winProbability" lib/auryn/v4 tests/auryn-v4-*.test.mjs
```

Expected: no `WAIT_FOR_CONFIRMATION`; no probability fields in the V4-A production contract. If a test contains the literal only to assert absence, keep it confined to that assertion.

- [ ] **Step 6: Commit regression-safe V4-A**

```bash
git status --short
git add -A
git commit -m "chore: verify AURYN V4-A core gates"
```

If `git status --short` is empty because prior task commits contain the complete verified state, skip the final empty commit.

---

## V4-A Acceptance Checklist

- [ ] One canonical V4-A engine exists under `lib/auryn/v4`.
- [ ] No Beginner/Pro/Extreme Pro setting enters the core engine.
- [ ] Business model and lifecycle are explicit and evidence-backed.
- [ ] At least the ten first-wave analyst models route deterministically.
- [ ] Missing required evidence is never filled with neutral `50`.
- [ ] Moat can be `UNKNOWN`; absence is not neutral.
- [ ] Slow thesis is stable across price-only changes.
- [ ] Narrative/contrarian edge requires evidence IDs.
- [ ] Confidence describes process quality, not probability of profit.
- [ ] Primary actions contain no `WAIT` state.
- [ ] Technical weakness can constrain NOW/SWING without automatically destroying long-term BUY logic.
- [ ] Broken thesis can force SELL even at cheap valuation.
- [ ] Extreme valuation can cap an otherwise excellent company at HOLD.
- [ ] Golden cases cover compounder, frontier, cyclical semiconductor, deteriorating thesis, extreme valuation, broken thesis, and missing evidence.
- [ ] Existing V65 engine behavior and UI remain unchanged in V4-A.
- [ ] `npm run test:v4-core`, `npm run test:engine`, `npm run build`, and `npm run audit:v65` all pass.

## Deferred to later approved sub-projects

These spec requirements are intentionally not implemented by this V4-A plan:

- **V4-B:** decision-first stock UI; Beginner/Pro/Extreme Pro presentation policy; new-investor/owner/trader position plans; scenario/thesis-breaker UX; portfolio overlay presentation.
- **V4-C:** structured agentic investment committee, red-team review, CIO synthesis, schema-validated LLM output, disagreement diagnostics.
- **V4-D:** V4 decision persistence, matured multi-horizon outcomes, cohort calibration, predictive-probability gates, proof/history UI.
- **Later scanner phase:** market-wide 4,500-stock opportunity discovery consuming V4 decisions.
- **Live execution phase:** remains disabled until separate safety, broker, legal/product, calibration, and user-control gates are explicitly designed and approved.
