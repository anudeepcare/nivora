"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANONICAL_FINANCIAL_ASSUMPTIONS = exports.FINANCIAL_ASSESSMENT_VERSION = void 0;
exports.financialModelCoverage = financialModelCoverage;
exports.buildFinancialAssessment = buildFinancialAssessment;
/** Deterministic financial research. Policy estimates are not reported facts or outcome probabilities. */
exports.FINANCIAL_ASSESSMENT_VERSION = 'financial-assessment-v1';
const POLICY_VERSION = 'fcfe-earnings-policy-v1';
const DAY = 86_400_000;
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const score = (n) => Math.round(Math.max(0, Math.min(100, n)));
const date = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
const url = (s) => typeof s === 'string' && /^https:\/\/[^\s]+$/.test(s);
const samePeriod = (a, b) => a.periodStart === b.periodStart && a.periodEnd === b.periodEnd && a.scope === b.scope && a.currency === b.currency && a.taxonomy === b.taxonomy;
const matureModels = new Set(['GENERAL_COMPOUNDER', 'CONSUMER', 'INDUSTRIAL', 'SEMICONDUCTOR_DESIGNER', 'DEFENSE', 'SAAS_SOFTWARE', 'MARKETPLACE_ADTECH', 'FINTECH_PAYMENTS', 'DIGITAL_HEALTH_PLATFORM']);
const frontierModels = new Set(['SPACE_SATELLITE', 'AI_DATA_CENTER_INFRA', 'POWER_UTILITY_INFRA', 'NETWORKING_COMPUTE_INFRA', 'BIOTECH_PHARMA']);
function financialModelCoverage(businessModel, lifecycle) {
    const model = businessModel.toUpperCase();
    const method = model === 'SPACE_SATELLITE' ? 'FRONTIER_SCENARIO_RUNWAY' : ['AI_DATA_CENTER_INFRA', 'POWER_UTILITY_INFRA', 'NETWORKING_COMPUTE_INFRA'].includes(model) ? 'AI_INFRA_SOTP_CAPACITY' : ['BANK', 'INSURER'].includes(model) ? 'BANK_PB_ROE_NIM' : model === 'REIT' ? 'REIT_FFO_AFFO' : ['BIOTECH_PHARMA', 'MEDTECH'].includes(model) ? 'BIOTECH_SCENARIO_PIPELINE' : ['ENERGY', 'MINER_COMMODITY'].includes(model) ? 'ENERGY_CYCLE_NAV' : model === 'SEMICONDUCTOR_MEMORY_CYCLICAL' ? 'CYCLE_NORMALIZED' : matureModels.has(model) ? 'DCF_FCF_EARNINGS' : 'GENERAL_RELATIVE';
    const methodImplemented = matureModels.has(model), mature = methodImplemented && ['SCALE', 'COMPOUNDER', 'MATURITY'].includes(lifecycle ?? '');
    const dimensions = model === 'SPACE_SATELLITE' ? ['deployedCapacity', 'usableCapacity', 'commercialConversion', 'regulatoryDependencies', 'cashRunway', 'funding', 'dilution'] : ['AI_DATA_CENTER_INFRA', 'POWER_UTILITY_INFRA', 'NETWORKING_COMPUTE_INFRA'].includes(model) ? ['segmentEconomics', 'contractedCapacity', 'operationalCapacity', 'power', 'utilization', 'delivery', 'equipmentEconomics', 'customers', 'capex', 'funding', 'dilution', 'miningExposure'] : ['revenue', 'profitability', 'cashGeneration', 'balanceSheet', 'reinvestment', 'moat'];
    return { businessModel: model, method, lifecycle: lifecycle ?? 'UNKNOWN', implemented: mature, implementationState: mature ? 'INPUTS_REQUIRED' : methodImplemented ? 'LIFECYCLE_NOT_SUPPORTED' : 'MODEL_NOT_IMPLEMENTED', dimensions, reason: mature ? 'Mature positive cash-flow method requires dated share reconciliation, financing/claims evidence and a separate normalized-earnings check.' : methodImplemented ? 'The cash-flow method requires a verified scale, compounder or mature lifecycle; unknown and pre-scale economics cannot establish its suitability.' : `${method} requires business-specific economics; this specialized valuation method is not implemented with sourced operating inputs.` };
}
exports.CANONICAL_FINANCIAL_ASSUMPTIONS = {
    bear: { kind: 'AURYN_ASSUMPTION', policyVersion: POLICY_VERSION, growthPct: -2, discountRatePct: 12, terminalGrowthPct: 0, dilutionPct: 2, horizonYears: 5, financingPolicy: 'Continue the sourced period cash claims; no extra borrowing is assumed.' },
    base: { kind: 'AURYN_ASSUMPTION', policyVersion: POLICY_VERSION, growthPct: 2, discountRatePct: 10, terminalGrowthPct: 1, dilutionPct: 1, horizonYears: 5, financingPolicy: 'Continue the sourced period cash claims; no extra borrowing is assumed.' },
    bull: { kind: 'AURYN_ASSUMPTION', policyVersion: POLICY_VERSION, growthPct: 5, discountRatePct: 9, terminalGrowthPct: 2, dilutionPct: 1, horizonYears: 5, financingPolicy: 'Continue the sourced period cash claims; no extra borrowing is assumed.' },
};
/** Equity cash flows; debt is handled in financing cash flows, never subtracted a second time. */
function project(cash, shares, a, evidenceIds) {
    let cashFlow = cash, denominator = shares, pv = 0;
    const projection = [];
    for (let year = 1; year <= 5; year++) {
        cashFlow *= 1 + a.growthPct / 100;
        denominator *= 1 + a.dilutionPct / 100;
        const presentValuePerShare = cashFlow / denominator / (1 + a.discountRatePct / 100) ** year;
        pv += presentValuePerShare;
        projection.push({ year, cashFlow, shares: denominator, presentValuePerShare });
    }
    const terminalPerShareGrowth = (1 + a.terminalGrowthPct / 100) / (1 + a.dilutionPct / 100) - 1;
    const terminalNextCashPerShare = cashFlow * (1 + a.terminalGrowthPct / 100) / (denominator * (1 + a.dilutionPct / 100));
    const terminalPresentValuePerShare = terminalNextCashPerShare / (a.discountRatePct / 100 - terminalPerShareGrowth) / (1 + a.discountRatePct / 100) ** 5;
    const value = pv + terminalPresentValuePerShare;
    return { value, valuePerShare: value, assumptions: { ...a }, evidenceIds, projection, explicitPresentValuePerShare: pv, terminalPresentValuePerShare, terminalWeightPct: terminalPresentValuePerShare / value * 100 };
}
function validFacts(input) {
    const all = input.company?.financials?.facts ?? [], day = input.asOf.slice(0, 10);
    const reported = (p) => p.source === 'SEC' && finite(p.value) && date(p.periodEnd) && date(p.filedAt) && p.periodEnd <= day && p.filedAt <= day && typeof p.sourceUrl === 'string' && /^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\/\d+\//.test(p.sourceUrl) && Boolean(p.accession && /^\d{10}-\d{2}-\d{6}$/.test(p.accession));
    if (!Number.isFinite(Date.parse(input.asOf)))
        return [];
    return all.filter(p => p.kind === 'REPORTED_FACT' ? reported(p) : p.kind === 'DERIVED' && finite(p.value) && date(p.periodEnd) && date(p.filedAt) && p.periodEnd <= day && p.filedAt <= day && p.inputIds.length > 1 && p.inputIds.every(id => { const r = all.find(f => f.id === id); return Boolean(r && r.kind === 'REPORTED_FACT' && reported(r)); }));
}
function buildThesis(input, facts, coverage) {
    const day = input.asOf.slice(0, 10);
    const claims = (input.company?.businessEvidence ?? []).filter(c => typeof c.id === 'string' && typeof c.text === 'string' && date(c.publishedAt) && c.publishedAt <= day && url(c.sourceUrl) && ['SEC', 'ISSUER', 'PROVIDER'].includes(c.source) && ['REPORTED_FACT', 'MANAGEMENT_GUIDANCE', 'EXTERNAL_ESTIMATE'].includes(c.kind));
    const latest = (metric) => facts.filter(f => f.metric === metric && ['ANNUAL', 'TTM'].includes(f.scope)).sort((a, b) => a.periodEnd.localeCompare(b.periodEnd) || a.filedAt.localeCompare(b.filedAt)).at(-1);
    const reasonsToOwn = [], counterarguments = [];
    for (const [metric, dimension, label] of [['revenue', 'revenue', 'Revenue'], ['netIncome', 'profitability', 'Net income'], ['operatingCashFlow', 'cashGeneration', 'Operating cash flow']]) {
        const f = latest(metric);
        if (!f)
            continue;
        const claim = { id: `thesis:${f.id}`, dimension, kind: 'REPORTED_FACT', text: `${label} was ${f.value.toLocaleString('en-US')} ${f.currency} for the ${f.scope.toLowerCase()} period ended ${f.periodEnd}.`, value: f.value, unit: f.unit, periodEnd: f.periodEnd, publishedAt: f.filedAt, source: 'SEC', sourceUrl: f.sourceUrl, evidenceIds: [f.id] };
        (f.value >= 0 ? reasonsToOwn : counterarguments).push(claim);
    }
    reasonsToOwn.push(...claims.filter(c => c.direction === 'POSITIVE'));
    counterarguments.push(...claims.filter(c => c.direction === 'NEGATIVE'));
    const guidanceReviews = claims.filter(c => c.kind === 'MANAGEMENT_GUIDANCE' && c.milestoneId).map(expected => {
        const actual = claims.filter(c => c.kind === 'REPORTED_FACT' && c.milestoneId === expected.milestoneId && c.dimension === expected.dimension && c.unit === expected.unit && c.periodEnd === expected.periodEnd && c.publishedAt >= expected.publishedAt).sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)).at(-1) ?? null;
        const comparable = actual && finite(expected.value) && finite(actual.value) && ['AT_LEAST', 'AT_MOST', 'EXACT'].includes(expected.targetOperator ?? '');
        const met = comparable && (expected.targetOperator === 'AT_MOST' ? actual.value <= expected.value : expected.targetOperator === 'EXACT' ? actual.value === expected.value : actual.value >= expected.value);
        const state = !actual ? 'PENDING' : comparable ? met ? 'MET' : 'MISSED' : 'REVIEW_REQUIRED';
        return { milestoneId: expected.milestoneId, expected, actual, state };
    });
    const available = new Set([...claims.map(c => c.dimension), ...reasonsToOwn.map(c => c.dimension), ...counterarguments.map(c => c.dimension)]);
    const invalidationConditions = coverage.businessModel === 'SPACE_SATELLITE' ? ['Documented deployment failure that prevents usable commercial capacity.', 'Regulatory denial that prevents the proposed service.', 'Verified funding shortfall before the next commercial milestone.'] : coverage.method === 'AI_INFRA_SOTP_CAPACITY' ? ['Loss of contracted customer economics or power access supported by a dated source.', 'Documented delivery or equipment economics that invalidate the funded capacity plan.', 'Verified financing shortfall or dilution that changes the ownership case.'] : ['Sustained deterioration in comparable operating economics supported by new filings.', 'A documented funding or governance event that changes the ownership case.'];
    return { businessModel: coverage.businessModel, lifecycle: coverage.lifecycle, coverageVersion: 'business-model-evidence-v1', reasonsToOwn, counterarguments, moatDrivers: claims.filter(c => c.dimension === 'moat' && c.kind === 'REPORTED_FACT'), claims, guidanceReviews, invalidationConditions, missingDimensions: coverage.dimensions.filter(d => !available.has(d)), status: coverage.dimensions.every(d => available.has(d)) ? 'SUPPORTED' : 'PARTIAL', why: claims.length ? 'Claims retain their source, publication date and reported-versus-guidance basis.' : 'Financial totals are available where sourced; business-specific operating, moat and guidance evidence still requires cited disclosures.' };
}
function buildValuation(input, facts, coverage) {
    const missingInputs = [];
    const missing = (metric, reasonCode, reason) => missingInputs.push({ metric, reasonCode, reason });
    if (!coverage.implemented)
        missing('method', coverage.implementationState, coverage.reason);
    const cashFacts = facts.filter(f => f.metric === 'operatingCashFlow' && ['ANNUAL', 'TTM'].includes(f.scope) && f.currency === 'USD' && f.unit === 'USD' && f.basis === 'GAAP');
    const required = ['capex', 'debtIssued', 'debtRepaid', 'shortTermDebtNet', 'preferredDividends', 'acquisitions', 'financeLeasePrincipal'];
    const match = (metric, anchor) => facts.find(f => f.metric === metric && samePeriod(f, anchor) && (anchor.kind === 'DERIVED' ? f.kind === 'DERIVED' : f.accession === anchor.accession && f.filedAt === anchor.filedAt));
    const anchor = [...cashFacts].sort((a, b) => a.periodEnd.localeCompare(b.periodEnd) || a.filedAt.localeCompare(b.filedAt)).at(-1);
    if ((input.company?.financials?.issues ?? []).some(i => i.code === 'CONFLICT' && i.status !== 'SUPERSEDED' && ['operatingCashFlow', 'revenue', 'netIncome', ...required, 'sharesOutstanding'].includes(i.metric) && (!anchor || !i.periodEnd || i.periodEnd >= anchor.periodEnd)))
        missing('sourceConflict', 'UNRESOLVED_CONFLICT', 'A recent material source conflict is unresolved; older observations cannot bypass it.');
    if (!anchor)
        missing('operatingCashFlow', 'MATCHING_CASH_FLOW_REQUIRED', 'Comparable sourced USD US GAAP annual or TTM cash flow is required.');
    if (anchor && (Date.parse(input.asOf) - Date.parse(anchor.periodEnd)) / DAY > 550)
        missing('operatingCashFlow', 'STALE', 'The starting cash-flow period is older than 18 months.');
    const cashInputs = anchor ? required.map(metric => ({ metric, fact: match(metric, anchor) })) : [];
    for (const entry of cashInputs)
        if (!entry.fact)
            missing(entry.metric, 'MATCHING_CLAIM_REQUIRED', `A matching reported ${entry.metric} value is required; an absent financing or cash-claim amount is not zero.`);
    if (anchor && facts.some(f => ['discontinuedOperatingCashFlow', 'discontinuedNetIncome'].includes(f.metric) && f.value !== 0 && f.periodEnd === anchor.periodEnd))
        missing('businessScope', 'DISCONTINUED_SCOPE', 'Consolidated cash claims cannot establish a continuing-business projection.');
    const review = input.company?.valuationReview;
    const shares = review ? facts.find(f => f.id === review.shareCountFactId && f.metric === 'sharesOutstanding' && f.scope === 'POINT_IN_TIME' && f.unit === 'shares' && f.value > 0) : null;
    const reviewValid = Boolean(review && ['SEC', 'ISSUER'].includes(review.source) && url(review.sourceUrl) && date(review.publishedAt) && review.publishedAt <= input.asOf.slice(0, 10) && review.claimsReviewed === true && review.shareClass && finite(review.unitsPerListedShare) && review.unitsPerListedShare > 0);
    if (!shares || !reviewValid)
        missing('shares', 'LISTED_SHARE_RECONCILIATION_REQUIRED', 'Current reported shares and a dated source-backed review of the listed share class, conversion ratio and other common-equity claims are required. Annual diluted averages and cap/price are not current share evidence.');
    if (shares && (Date.parse(input.asOf) - Date.parse(shares.periodEnd)) / DAY > 365)
        missing('shares', 'STALE', 'Current shares are more than one year old; review intervening issuance, splits and buybacks.');
    if (shares && facts.some(f => f.metric === 'sharesOutstanding' && (f.periodEnd > shares.periodEnd || f.periodEnd === shares.periodEnd && f.filedAt > shares.filedAt)))
        missing('shares', 'SHARE_REVIEW_SUPERSEDED', 'Newer share evidence supersedes this listed-share review; reconcile the latest filing before valuing each share.');
    const income = facts.filter(f => f.metric === 'netIncome' && f.scope === 'ANNUAL' && f.currency === 'USD' && f.basis === 'GAAP' && f.value > 0 && anchor && f.periodEnd <= anchor.periodEnd).sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));
    const uniqueIncome = [...new Map(income.map(f => [f.periodEnd, f])).values()].slice(-3);
    const incomeComparable = uniqueIncome.length === 3 && uniqueIncome.every((f, i) => i === 0 || (Date.parse(f.periodEnd) - Date.parse(uniqueIncome[i - 1].periodEnd)) / DAY >= 330 && (Date.parse(f.periodEnd) - Date.parse(uniqueIncome[i - 1].periodEnd)) / DAY <= 400) && !facts.some(f => f.metric === 'discontinuedNetIncome' && f.value !== 0 && uniqueIncome.some(n => n.periodEnd === f.periodEnd));
    if (!incomeComparable)
        missing('crossCheck', 'INDEPENDENT_CROSS_CHECK_REQUIRED', 'Three consecutive comparable positive annual earnings periods are required for the separate normalized-earnings check.');
    const valueOf = (metric) => cashInputs.find(x => x.metric === metric)?.fact?.value ?? null;
    const claimsComplete = cashInputs.length === required.length && cashInputs.every(x => x.fact);
    // Net borrowing is capped at zero: issuing new debt cannot create sustainable canonical value.
    const ownerCash = anchor && claimsComplete ? anchor.value - Math.abs(valueOf('capex')) + Math.min(0, valueOf('debtIssued') - Math.abs(valueOf('debtRepaid')) + valueOf('shortTermDebtNet')) - Math.abs(valueOf('preferredDividends')) - Math.abs(valueOf('acquisitions')) - Math.abs(valueOf('financeLeasePrincipal')) : null;
    if (ownerCash !== null && ownerCash <= 0)
        missing('ownerCashFlow', 'NONPOSITIVE_CASH_FLOW', 'Positive cash flow after the sourced financing and other cash claims is required.');
    const denominator = shares && reviewValid ? shares.value / review.unitsPerListedShare : null;
    const evidenceIds = [...new Set([...(anchor ? [anchor.id] : []), ...cashInputs.flatMap(x => x.fact ? [x.fact.id] : []), ...(shares ? [shares.id] : []), ...uniqueIncome.map(f => f.id)])];
    const evidenceAsOf = [...facts.filter(f => evidenceIds.includes(f.id)).map(f => f.filedAt), ...(reviewValid && review ? [review.publishedAt] : [])].sort().at(-1) ?? null;
    const crossChecks = [];
    if (incomeComparable && denominator) {
        const normalized = median(uniqueIncome.map(f => f.value));
        crossChecks.push({ family: 'NORMALIZED_EARNINGS', method: 'Median reported net income × 75% distribution / 10% required return / listed shares', valuePerShare: normalized * .75 / .10 / denominator, independentOfPrimaryMethod: true, evidenceIds: uniqueIncome.map(f => f.id), assumptions: { kind: 'AURYN_ASSUMPTION', normalizedNetIncome: normalized, distributionPct: 75, discountRatePct: 10, growthPct: 0 }, limitations: 'Same issuer filing source, separate earnings method. 25% earnings retention and zero growth are policy assumptions, not a peer multiple, management forecast or calibrated outcome.' });
    }
    let scenarios = null;
    if (!missingInputs.length && ownerCash !== null && denominator) {
        scenarios = { bear: project(ownerCash, denominator, exports.CANONICAL_FINANCIAL_ASSUMPTIONS.bear, evidenceIds), base: project(ownerCash, denominator, exports.CANONICAL_FINANCIAL_ASSUMPTIONS.base, evidenceIds), bull: project(ownerCash, denominator, exports.CANONICAL_FINANCIAL_ASSUMPTIONS.bull, evidenceIds) };
        const check = crossChecks[0].valuePerShare, ratio = scenarios.base.value / check;
        if (ratio < .5 || ratio > 2) {
            missing('crossCheck', 'METHOD_DISAGREEMENT', 'Cash-flow and normalized-earnings estimates differ by more than twofold; review normalization and assumptions.');
            scenarios = null;
        }
    }
    const decisionGrade = Boolean(scenarios), fairValue = scenarios?.base.value ?? null;
    const priceTime = input.priceAsOf ? Date.parse(input.priceAsOf) : NaN, now = Date.parse(input.asOf);
    const priceValid = finite(input.currentPrice) && input.currentPrice > 0 && input.priceCurrency === 'USD' && Number.isFinite(priceTime) && priceTime <= now && now - priceTime <= 7 * DAY;
    const marginOfSafetyPct = fairValue !== null && fairValue > 0 && priceValid ? (fairValue - input.currentPrice) / fairValue * 100 : null;
    const upsidePct = fairValue !== null && priceValid ? (fairValue / input.currentPrice - 1) * 100 : null;
    const sensitivity = scenarios && ownerCash !== null && denominator ? [8, 10, 12].flatMap(discountRatePct => [-2, 2, 5].map(growthPct => ({ discountRatePct, growthPct, valuePerShare: project(ownerCash, denominator, { ...exports.CANONICAL_FINANCIAL_ASSUMPTIONS.base, discountRatePct, growthPct }, evidenceIds).value }))) : [];
    let impliedExpectations = null;
    if (scenarios && ownerCash !== null && denominator && priceValid) {
        let lo = -50, hi = 50;
        const evaluate = (g) => project(ownerCash, denominator, { ...exports.CANONICAL_FINANCIAL_ASSUMPTIONS.base, growthPct: g }, evidenceIds).value;
        const inRange = evaluate(lo) <= input.currentPrice && evaluate(hi) >= input.currentPrice;
        if (inRange)
            for (let i = 0; i < 64; i++) {
                const mid = (lo + hi) / 2;
                if (evaluate(mid) < input.currentPrice)
                    lo = mid;
                else
                    hi = mid;
            }
        impliedExpectations = { growthPct: inRange ? (lo + hi) / 2 : null, reasonCode: inRange ? null : 'NO_SOLUTION_IN_DOMAIN', fixedAssumptions: { ...exports.CANONICAL_FINANCIAL_ASSUMPTIONS.base } };
    }
    return { version: exports.FINANCIAL_ASSESSMENT_VERSION, policyVersion: POLICY_VERSION, method: coverage.method, state: decisionGrade ? 'MEASURED' : coverage.implemented ? 'PARTIAL' : 'UNSUPPORTED', decisionGrade, implementationState: decisionGrade ? 'IMPLEMENTED_WITH_EVIDENCE' : coverage.implementationState, missingInputs, missingMethodInputs: missingInputs.map(x => x.reason), scenarios, fairValue, marginOfSafetyPct, upsidePct, valuationScore: marginOfSafetyPct === null ? null : score(50 + marginOfSafetyPct), crossChecks, independentCrossChecks: crossChecks.length, evidenceIds, evidenceAsOf, periodStart: anchor?.periodStart ?? null, periodEnd: anchor?.periodEnd ?? null, scope: anchor?.scope ?? null, shares: denominator, shareBasis: denominator ? 'CURRENT_REPORTED_LISTED_SHARES' : null, shareReview: reviewValid ? review : null, ownerCashFlow: ownerCash, sensitivity, impliedExpectations, priceComparisonAsOf: priceValid ? input.priceAsOf : null, outcomeValidation: 'UNVALIDATED', why: decisionGrade ? 'Sourced cash flow, current listed shares and a separate normalized-earnings method support conditional policy scenarios.' : missingInputs[0]?.reason ?? coverage.reason, warnings: ['Bear/base/bull assumptions are versioned AURYN policy scenarios, not probabilities or management guidance.', 'The earnings check shares the issuer source with cash flow; methodological independence is not source independence.', 'Canonical estimates assume the sourced cash-claim burden persists; later financing or operating changes require a new snapshot.', ...(anchor?.scope === 'ANNUAL' ? ['Starting economics are annual reported results, not TTM.'] : []), ...(!priceValid ? ['Price comparison requires a dated USD reference within seven calendar days.'] : [])] };
}
function fundingAssessment(input, claims) {
    const current = claims.filter(c => c.kind === 'REPORTED_FACT' && (Date.parse(input.asOf) - Date.parse(c.publishedAt)) / DAY <= 180);
    const runway = current.filter(c => c.dimension === 'cashRunway' && c.unit?.toLowerCase() === 'months' && finite(c.value) && c.value >= 0 && date(c.periodEnd) && c.periodEnd <= input.asOf.slice(0, 10) && (Date.parse(input.asOf) - Date.parse(c.periodEnd)) / DAY <= 180).sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)).at(-1);
    const adverse = current.filter(c => c.dimension === 'funding' && c.direction === 'NEGATIVE');
    const state = adverse.length || runway && runway.value < 12 ? 'elevated' : runway && runway.value >= 24 ? 'normal' : 'unknown';
    const used = [...(runway ? [runway] : []), ...adverse];
    return { state, evidenceIds: [...new Set(used.flatMap(c => [c.id, ...(c.evidenceIds ?? [])]))], evidenceAsOf: used.map(c => c.publishedAt).sort().at(-1) ?? null, why: state === 'elevated' ? 'A current reported funding counterargument or less than 12 months of reported runway warrants elevated funding risk.' : state === 'normal' ? 'At least 24 months of current reported runway and no reviewed funding counterargument support the normal category under AURYN policy; this does not rule out unreported obligations.' : 'Current reported runway or an explicit funding disclosure is insufficient. Valuation readiness does not establish funding safety.', policyVersion: 'reported-runway-v1' };
}
function buildFinancialAssessment(input) {
    const facts = validFacts(input), coverage = financialModelCoverage(input.businessModel, input.lifecycle), thesis = buildThesis(input, facts, coverage), valuation = buildValuation(input, facts, coverage), fundingRisk = fundingAssessment(input, thesis.claims);
    const annual = facts.filter(f => f.scope === 'ANNUAL' && f.unit !== 'shares');
    const revenue = annual.filter(f => f.metric === 'revenue').sort((a, b) => a.periodEnd.localeCompare(b.periodEnd) || a.filedAt.localeCompare(b.filedAt)).at(-1);
    const at = (metric) => revenue ? annual.find(f => f.metric === metric && samePeriod(f, revenue) && f.accession === revenue.accession) : null;
    const income = at('netIncome'), operating = at('operatingIncome'), cfo = at('operatingCashFlow'), capex = at('capex');
    const previous = revenue ? annual.filter(f => f.metric === 'revenue' && f.currency === revenue.currency && f.taxonomy === revenue.taxonomy && f.concept === revenue.concept && (Date.parse(revenue.periodEnd) - Date.parse(f.periodEnd)) / DAY >= 330 && (Date.parse(revenue.periodEnd) - Date.parse(f.periodEnd)) / DAY <= 400).sort((a, b) => a.periodEnd.localeCompare(b.periodEnd)).at(-1) : null;
    const growth = revenue && previous && previous.value > 0 ? (revenue.value / previous.value - 1) * 100 : null;
    const margin = operating && revenue && revenue.value > 0 ? operating.value / revenue.value * 100 : null;
    const cashMargin = cfo && capex && revenue && revenue.value > 0 ? (cfo.value - Math.abs(capex.value)) / revenue.value * 100 : null;
    const dimensions = [growth === null ? null : score(50 + growth), margin === null ? null : score(45 + margin * 1.5), cashMargin === null ? null : score(45 + cashMargin * 2)].filter((n) => n !== null);
    const preScale = frontierModels.has(coverage.businessModel) || ['PRE_COMMERCIAL', 'VALIDATION'].includes(input.lifecycle ?? '');
    const unsupportedQuality = ['BANK', 'INSURER', 'REIT', 'BIOTECH_PHARMA', 'MEDTECH', 'ENERGY', 'MINER_COMMODITY', 'SEMICONDUCTOR_MEMORY_CYCLICAL', 'TURNAROUND_DISTRESSED'].includes(coverage.businessModel);
    const changedScope = revenue && facts.some(f => ['discontinuedNetIncome', 'discontinuedOperatingCashFlow'].includes(f.metric) && f.value !== 0 && f.periodEnd === revenue.periodEnd);
    const unresolvedConflict = revenue && (input.company?.financials?.issues ?? []).some(i => i.code === 'CONFLICT' && i.status !== 'SUPERSEDED' && ['revenue', 'netIncome', 'operatingCashFlow', 'operatingIncome', 'capex'].includes(i.metric) && (!i.periodEnd || i.periodEnd >= revenue.periodEnd));
    const current = revenue && !changedScope && !unresolvedConflict && (Date.parse(input.asOf) - Date.parse(revenue.periodEnd)) / DAY <= 550;
    const businessScore = !preScale && !unsupportedQuality && current && dimensions.length >= 2 ? Math.round(mean(dimensions)) : null;
    const fundamentalScore = businessScore;
    const metricNames = { revenue: 'Revenue', netIncome: 'Net income', operatingCashFlow: 'Operating cash flow', capex: 'Capital expenditure', operatingIncome: 'Operating income' };
    const metrics = revenue ? facts.filter(f => metricNames[f.metric] && samePeriod(f, revenue) && f.accession === revenue.accession).map(f => ({ key: f.metric, label: metricNames[f.metric], value: f.value, unit: f.unit, currency: f.currency, periodStart: f.periodStart, periodEnd: f.periodEnd, scope: f.scope, definition: `${metricNames[f.metric]} as reported; ${f.basis}, ${f.scope.toLowerCase()} period.`, source: 'SEC', sourceUrl: f.sourceUrl, sourceUrls: f.sourceUrls, asOf: f.filedAt, evidenceIds: [f.id, ...f.inputIds], accountingBasis: f.basis })) : [];
    const evidenceIds = [...new Set([revenue, previous, income, operating, cfo, capex].filter((f) => Boolean(f)).map(f => f.id))];
    const evidenceAsOf = facts.filter(f => evidenceIds.includes(f.id)).map(f => f.filedAt).sort().at(-1) ?? null;
    return { version: exports.FINANCIAL_ASSESSMENT_VERSION, asOf: input.asOf, businessScore, fundamentalScore, scoreFamily: 'REPORTED_OPERATING_ECONOMICS', forwardEvidence: { state: 'UNAVAILABLE', score: null, reason: 'Dated comparable forward estimates and revisions are not connected. Reported operating quality is not an independent forward-expectations vote.' }, valuationScore: valuation.decisionGrade ? valuation.valuationScore : null, valuation, thesis, fundingRisk, evidenceIds, evidenceAsOf, metrics, coverage, businessWhy: businessScore === null ? preScale ? 'This lifecycle needs delivered operating milestones and funded unit economics; trailing profitability is not a sufficient business-quality model.' : 'Comparable current source evidence is insufficient for this business model.' : 'Comparable reported revenue growth, operating margin and cash conversion support an operating-quality proxy; price is excluded and this is not a moat score.', fundamentalWhy: fundamentalScore === null ? 'A suitable sourced fundamental assessment is unavailable.' : 'The fundamental score uses the same reported operating-economics family as business quality; it is not independent forward analyst consensus.' };
}
