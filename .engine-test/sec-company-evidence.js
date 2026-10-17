"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSecCompanyEvidence = buildSecCompanyEvidence;
const TAGS = {
    revenue: ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet', 'Revenue', 'RevenueFromContractsWithCustomers'],
    netIncome: ['NetIncomeLoss', 'ProfitLoss', 'ProfitLossFromContinuingOperations'],
    continuingNetIncome: ['IncomeLossFromContinuingOperations', 'ProfitLossFromContinuingOperations'],
    discontinuedNetIncome: ['IncomeLossFromDiscontinuedOperationsNetOfTax', 'ProfitLossFromDiscontinuedOperations'],
    cash: ['CashAndCashEquivalentsAtCarryingValue', 'CashAndCashEquivalents'],
    assets: ['Assets'],
    liabilities: ['Liabilities'],
    operatingCashFlow: ['NetCashProvidedByUsedInOperatingActivities', 'CashFlowsFromUsedInOperatingActivities'],
    continuingOperatingCashFlow: ['NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'],
    discontinuedOperatingCashFlow: ['CashProvidedByUsedInOperatingActivitiesDiscontinuedOperations'],
    capex: ['PaymentsToAcquirePropertyPlantAndEquipment', 'PurchaseOfPropertyPlantAndEquipment', 'PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities'],
    grossProfit: ['GrossProfit', 'GrossProfitLoss'],
    operatingIncome: ['OperatingIncomeLoss', 'ProfitLossFromOperatingActivities'],
    currentDebt: ['LongTermDebtCurrent', 'LongTermDebtAndCapitalLeaseObligationsCurrent'],
    noncurrentDebt: ['LongTermDebtNoncurrent', 'LongTermDebtAndCapitalLeaseObligationsNoncurrent'],
    longTermDebtIncludingCurrent: ['LongTermDebtAndFinanceLeaseObligationsIncludingCurrentMaturities'],
    shortTermBorrowings: ['ShortTermBorrowings'],
    debtIssued: ['ProceedsFromIssuanceOfLongTermDebt'],
    debtRepaid: ['RepaymentsOfLongTermDebt'],
    shortTermDebtNet: ['ProceedsFromRepaymentsOfShortTermDebt'],
    preferredDividends: ['PaymentsOfDividendsPreferredStockAndPreferenceStock'],
    stockCompensation: ['ShareBasedCompensation'],
    dividends: ['PaymentsOfDividendsCommonStock'],
    acquisitions: ['PaymentsToAcquireBusinessesNetOfCashAcquired'],
    financeLeasePrincipal: ['FinanceLeasePrincipalPayments'],
    equity: ['StockholdersEquity'],
};
const INSTANTS = new Set(['cash', 'assets', 'liabilities', 'currentDebt', 'noncurrentDebt', 'longTermDebtIncludingCurrent', 'shortTermBorrowings', 'equity']);
const ANNUAL_FORMS = new Set(['10-K', '10-K/A', '20-F', '20-F/A', '40-F', '40-F/A']);
const FORMS = new Set([...ANNUAL_FORMS, '10-Q', '10-Q/A', '6-K', '6-K/A']);
const DAY = 86400000;
const validDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const days = (start, end) => Math.round((Date.parse(end) - Date.parse(start)) / DAY) + 1;
const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));
const last = (values) => values.length ? values[values.length - 1] : null;
const value = (point) => point?.value ?? null;
function normalizeFacts(payload, cik, asOf, issues) {
    const out = [];
    const facts = payload?.facts ?? payload ?? {};
    for (const taxonomy of ['us-gaap', 'ifrs-full'])
        for (const metric of Object.keys(TAGS)) {
            TAGS[metric].forEach((concept, priority) => {
                for (const [unit, rows] of Object.entries(facts[taxonomy]?.[concept]?.units ?? {})) {
                    if (!/^[A-Z]{3}$/.test(unit) || !Array.isArray(rows))
                        continue;
                    for (const row of rows) {
                        if (typeof row?.val !== 'number' || !Number.isFinite(row.val) || !validDate(row.end) || !validDate(row.filed) || row.filed > asOf || row.end > asOf || !FORMS.has(row.form))
                            continue;
                        const start = validDate(row.start) ? row.start : null;
                        const duration = start ? days(start, row.end) : null;
                        const instant = INSTANTS.has(metric);
                        const scope = instant ? (row.start == null ? 'POINT_IN_TIME' : null) : duration != null && duration >= 330 && duration <= 400 && ANNUAL_FORMS.has(row.form) ? 'ANNUAL' : duration != null && duration >= 70 && duration <= 110 ? 'QUARTER' : duration != null && ((duration >= 150 && duration <= 210) || (duration >= 240 && duration <= 310)) ? 'YTD' : null;
                        if (!scope)
                            continue;
                        const accession = typeof row.accn === 'string' && /^\d{10}-\d{2}-\d{6}$/.test(row.accn) ? row.accn : null;
                        const numericCik = /^\d+$/.test(cik) ? String(Number(cik)) : null;
                        out.push({ metric, value: row.val, currency: unit, unit, periodStart: start, periodEnd: row.end, filedAt: row.filed, accession, form: row.form, concept, taxonomy, scope, source: 'SEC', basis: taxonomy === 'ifrs-full' ? 'IFRS' : 'GAAP', priority,
                            sourceUrl: accession && numericCik ? `https://www.sec.gov/Archives/edgar/data/${numericCik}/${accession.replaceAll('-', '')}/${accession}-index.html` : null });
                    }
                }
            });
        }
    const groupKey = (p) => [p.metric, p.currency, p.taxonomy, p.periodStart, p.periodEnd, p.scope].join('|');
    const filingGroups = new Map();
    for (const p of out) {
        const key = `${groupKey(p)}|${p.filedAt}|${p.accession}`;
        filingGroups.set(key, [...(filingGroups.get(key) ?? []), p]);
    }
    const conflicts = new Map();
    for (const rows of filingGroups.values())
        if (new Set(rows.map(p => p.value)).size > 1) {
            const p = rows[0], key = groupKey(p);
            conflicts.set(key, [conflicts.get(key) ?? '', p.filedAt].sort().at(-1));
        }
    for (const rows of filingGroups.values())
        if (new Set(rows.map(p => p.value)).size > 1) {
            const p = rows[0], key = groupKey(p), later = out.filter(x => groupKey(x) === key && x.filedAt > conflicts.get(key));
            const latestDate = later.map(x => x.filedAt).sort().at(-1), latest = later.filter(x => x.filedAt === latestDate);
            const resolved = latest.length > 0 && new Set(latest.map(x => x.value)).size === 1;
            issues.push({ code: 'CONFLICT', metric: p.metric, periodEnd: p.periodEnd, periodStart: p.periodStart, currency: p.currency, taxonomy: p.taxonomy, filedAt: p.filedAt, status: resolved ? 'SUPERSEDED' : 'UNRESOLVED', ...(resolved ? { resolvedAt: latestDate, resolvedAccession: latest[0].accession } : {}), reason: resolved ? `Historical ${p.metric} conflict in ${p.accession ?? p.filedAt} was superseded by unambiguous same-basis evidence filed ${latestDate}.` : `Conflicting ${p.metric} values in filing ${p.accession ?? p.filedAt}; no value is selected from that filing or an older one.` });
        }
    return out.filter(p => !conflicts.has(groupKey(p)) || p.filedAt > conflicts.get(groupKey(p)));
}
// Fresh periods and restatements outrank concept aliases. USD is only a tie breaker
// between explicitly reported units; no implicit currency conversion is performed.
function rank(a, b) {
    return a.periodEnd.localeCompare(b.periodEnd) || a.filedAt.localeCompare(b.filedAt) || b.priority - a.priority || Number(a.currency === 'USD') - Number(b.currency === 'USD') || (a.accession ?? '').localeCompare(b.accession ?? '') || a.concept.localeCompare(b.concept);
}
function newest(points) { return last([...points].sort(rank)); }
function series(points) {
    const byEnd = new Map();
    for (const point of [...points].sort(rank))
        byEnd.set(point.periodEnd, point);
    return [...byEnd.values()].sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));
}
function matches(a, b) {
    return Boolean(a && b && a.scope === b.scope && a.periodStart === b.periodStart && a.periodEnd === b.periodEnd && a.currency === b.currency && a.taxonomy === b.taxonomy);
}
function sameFiling(a, b) {
    return Boolean(a && b && (a.accession && b.accession ? a.accession === b.accession : a.filedAt === b.filedAt));
}
function periodFact(points, metric, anchor) {
    return anchor ? newest(points.filter(p => p.metric === metric && matches(p, anchor) && sameFiling(p, anchor))) : null;
}
function ratio(numerator, denominator) {
    return matches(numerator, denominator) && denominator.value !== 0 ? numerator.value / denominator.value * 100 : null;
}
function comparable(a, b, points) {
    if (!a || !b || a.scope !== b.scope || a.currency !== b.currency || a.taxonomy !== b.taxonomy || !a.periodStart || !b.periodStart)
        return false;
    const yearGap = days(b.periodEnd, a.periodEnd) - 1;
    if (yearGap < 330 || yearGap > 400 || Math.abs(days(a.periodStart, a.periodEnd) - days(b.periodStart, b.periodEnd)) > 14)
        return false;
    if (a.concept === b.concept)
        return true;
    // A concept transition is bridged only when the current concept also reports
    // the comparison period with the same value, unit and accounting taxonomy.
    return points.some(p => p.metric === a.metric && p.concept === a.concept && matches(p, b) && p.value === b.value);
}
function growth(current, prior, points) {
    return comparable(current, prior, points) && prior.value > 0 ? (current.value / prior.value - 1) * 100 : null;
}
function priorPeriod(points, current) {
    if (!current)
        return null;
    return newest(points.filter(p => p.metric === current.metric && p.periodEnd < current.periodEnd && comparable(current, p, points)));
}
function trend(values) {
    if (values.length < 2)
        return 'Limited';
    let up = 0, down = 0;
    for (let i = 1; i < values.length; i++) {
        if (values[i] > values[i - 1])
            up++;
        else if (values[i] < values[i - 1])
            down++;
    }
    return up >= Math.max(2, values.length - 2) ? 'Strong' : up > down ? 'Improving' : down > up ? 'Weakening' : 'Mixed';
}
function money(amount, currency) {
    const n = Math.abs(amount), sign = amount < 0 ? '-' : '', prefix = currency === 'USD' ? '$' : `${currency} `;
    return `${sign}${prefix}${n >= 1e12 ? `${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : Math.round(n).toLocaleString('en-US')}`;
}
function evidence(key, point) {
    const { priority, metric, ...rest } = point;
    return { key, ...rest, period: point.scope === 'POINT_IN_TIME' ? point.periodEnd : `${point.periodStart} – ${point.periodEnd}` };
}
const nextDay = (date) => new Date(Date.parse(date) + DAY).toISOString().slice(0, 10);
function financialFacts(points, payload, cik, asOf, issues) {
    const toFact = (p) => ({ id: `sec:${p.metric}:${p.periodStart ?? ''}:${p.periodEnd}:${p.currency}:${p.accession ?? p.filedAt}:${p.concept}`, metric: p.metric, value: p.value, currency: p.currency, unit: p.unit, periodStart: p.periodStart, periodEnd: p.periodEnd, filedAt: p.filedAt, accession: p.accession, form: p.form, concept: p.concept, taxonomy: p.taxonomy, scope: p.scope, source: 'SEC', sourceUrl: p.sourceUrl, sourceUrls: p.sourceUrl ? [p.sourceUrl] : [], basis: p.basis, kind: 'REPORTED_FACT', inputIds: [], calculation: null });
    const selected = new Map();
    for (const p of [...points].sort(rank))
        selected.set([p.metric, p.periodStart, p.periodEnd, p.currency, p.taxonomy, p.scope].join('|'), p);
    const out = [...selected.values()].map(toFact);
    const shareTags = [['dei', 'EntityCommonStockSharesOutstanding', 'sharesOutstanding'], ['us-gaap', 'CommonStockSharesOutstanding', 'sharesOutstanding'], ['us-gaap', 'WeightedAverageNumberOfDilutedSharesOutstanding', 'dilutedShares'], ['us-gaap', 'WeightedAverageNumberOfSharesOutstandingBasic', 'basicAverageShares']];
    for (const [taxonomy, concept, metric] of shareTags) {
        const rows = (payload?.facts ?? payload ?? {})[taxonomy]?.[concept]?.units?.shares;
        if (!Array.isArray(rows))
            continue;
        const groups = new Map();
        for (const row of rows) {
            if (typeof row.val !== 'number' || !Number.isFinite(row.val) || row.val <= 0 || !validDate(row.end) || !validDate(row.filed) || row.end > asOf || row.filed > asOf || !FORMS.has(row.form))
                continue;
            const instant = metric === 'sharesOutstanding', duration = validDate(row.start) ? days(row.start, row.end) : null;
            if (instant ? row.start != null : duration == null || duration < 330 || duration > 400 || !ANNUAL_FORMS.has(row.form))
                continue;
            const key = [row.start ?? '', row.end].join('|');
            groups.set(key, [...(groups.get(key) ?? []), row]);
        }
        for (const rows of groups.values()) {
            const filed = rows.map(r => r.filed).sort().at(-1), current = rows.filter(r => r.filed === filed);
            if (new Set(current.map(r => r.val)).size > 1) {
                issues.push({ code: 'CONFLICT', metric, periodEnd: current[0].end, reason: `Conflicting reported ${metric}.` });
                continue;
            }
            const r = current[0], accession = typeof r.accn === 'string' && /^\d{10}-\d{2}-\d{6}$/.test(r.accn) ? r.accn : null;
            const sourceUrl = accession && /^\d+$/.test(cik) ? `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replaceAll('-', '')}/${accession}-index.html` : null;
            out.push({ id: `sec:${metric}:${r.start ?? ''}:${r.end}:shares:${accession ?? r.filed}:${concept}`, metric, value: r.val, currency: null, unit: 'shares', periodStart: r.start ?? null, periodEnd: r.end, filedAt: r.filed, accession, form: r.form, concept, taxonomy, scope: metric === 'sharesOutstanding' ? 'POINT_IN_TIME' : 'ANNUAL', source: 'SEC', sourceUrl, sourceUrls: sourceUrl ? [sourceUrl] : [], basis: 'GAAP', kind: 'REPORTED_FACT', inputIds: [], calculation: null });
        }
    }
    const sameBasis = (a, b) => a.metric === b.metric && a.currency === b.currency && a.taxonomy === b.taxonomy && a.concept === b.concept;
    const derive = (anchor, inputs, scope, start, value, calculation) => {
        const inputIds = [...new Set(inputs.flatMap(p => p.inputIds.length ? p.inputIds : [p.id]))].sort(), sourceUrls = [...new Set(inputs.flatMap(p => p.sourceUrls))].sort();
        return { ...anchor, id: `derived:${scope}:${anchor.metric}:${start}:${anchor.periodEnd}:${inputIds.join(';')}`, value, scope, periodStart: start, filedAt: inputs.map(p => p.filedAt).sort().at(-1), accession: null, kind: 'DERIVED', inputIds, sourceUrls, calculation };
    };
    const durations = out.filter(p => p.unit !== 'shares' && p.scope !== 'POINT_IN_TIME');
    for (const current of durations.filter(p => p.scope === 'YTD' || p.scope === 'ANNUAL')) {
        const prior = durations.filter(p => sameBasis(p, current) && p.periodStart === current.periodStart && p.periodEnd < current.periodEnd && days(p.periodEnd, current.periodEnd) - 1 >= 70 && days(p.periodEnd, current.periodEnd) - 1 <= 110).sort((a, b) => a.periodEnd.localeCompare(b.periodEnd)).at(-1);
        if (prior && !out.some(p => sameBasis(p, current) && p.scope === 'QUARTER' && p.periodStart === nextDay(prior.periodEnd) && p.periodEnd === current.periodEnd))
            out.push(derive(current, [current, prior], 'QUARTER', nextDay(prior.periodEnd), current.value - prior.value, 'CUMULATIVE_CURRENT_MINUS_PRIOR'));
    }
    for (const current of durations.filter(p => p.scope === 'YTD' || p.scope === 'QUARTER')) {
        if (!current.periodStart)
            continue;
        const annual = durations.filter(p => sameBasis(p, current) && p.scope === 'ANNUAL' && nextDay(p.periodEnd) === current.periodStart).sort((a, b) => a.filedAt.localeCompare(b.filedAt)).at(-1);
        if (!annual?.periodStart)
            continue;
        const prior = durations.filter(p => sameBasis(p, current) && p.periodStart === annual.periodStart && p.periodEnd < annual.periodEnd && Math.abs(days(p.periodStart, p.periodEnd) - days(current.periodStart, current.periodEnd)) <= 14).sort((a, b) => a.filedAt.localeCompare(b.filedAt)).at(-1);
        if (!prior || days(nextDay(prior.periodEnd), current.periodEnd) < 330 || days(nextDay(prior.periodEnd), current.periodEnd) > 400)
            continue;
        out.push(derive(current, [annual, current, prior], 'TTM', nextDay(prior.periodEnd), annual.value + current.value - prior.value, 'LATEST_ANNUAL_PLUS_CURRENT_YTD_MINUS_PRIOR_YTD'));
    }
    const quarterFacts = out.filter(p => p.scope === 'QUARTER' && p.unit !== 'shares');
    for (const latest of quarterFacts) {
        if (out.some(p => sameBasis(p, latest) && p.scope === 'TTM' && p.periodEnd === latest.periodEnd))
            continue;
        const sequence = quarterFacts.filter(p => sameBasis(p, latest) && p.periodEnd <= latest.periodEnd).sort((a, b) => a.periodEnd.localeCompare(b.periodEnd)).slice(-4);
        if (sequence.length !== 4 || !sequence[0].periodStart || sequence.some((p, i) => i > 0 && p.periodStart !== nextDay(sequence[i - 1].periodEnd)))
            continue;
        const duration = days(sequence[0].periodStart, latest.periodEnd);
        if (duration >= 330 && duration <= 400)
            out.push(derive(latest, sequence, 'TTM', sequence[0].periodStart, sequence.reduce((sum, p) => sum + p.value, 0), 'SUM_FOUR_CONTIGUOUS_QUARTERS'));
    }
    return out.filter(p => !issues.some(i => i.code === 'CONFLICT' && i.metric === p.metric && p.unit === 'shares' && i.periodEnd !== null && p.periodEnd <= i.periodEnd)).sort((a, b) => a.periodEnd.localeCompare(b.periodEnd) || a.metric.localeCompare(b.metric) || a.id.localeCompare(b.id));
}
// Shares are a count, not a monetary fact. Keep their unit separate and only
// pair the annual diluted denominator with the exact cash-flow filing/period.
function annualDilutedShareEvidence(payload, anchor, asOf) {
    if (!anchor || anchor.taxonomy !== 'us-gaap' || anchor.scope !== 'ANNUAL' || !anchor.accession || !anchor.sourceUrl)
        return null;
    const concept = 'WeightedAverageNumberOfDilutedSharesOutstanding';
    const rows = (payload?.facts ?? payload ?? {})['us-gaap']?.[concept]?.units?.shares;
    if (!Array.isArray(rows))
        return null;
    const matched = rows.filter((row) => typeof row?.val === 'number' && Number.isFinite(row.val) && row.val > 0 && row.start === anchor.periodStart && row.end === anchor.periodEnd && row.accn === anchor.accession && row.filed === anchor.filedAt && validDate(row.filed) && row.filed <= asOf && row.end <= asOf && ANNUAL_FORMS.has(row.form));
    if (!matched.length || new Set(matched.map((row) => row.val)).size !== 1)
        return null;
    return { key: 'dilutedShares', value: matched[0].val, currency: null, unit: 'shares', periodStart: anchor.periodStart, periodEnd: anchor.periodEnd, filedAt: anchor.filedAt, accession: anchor.accession, form: anchor.form, concept, taxonomy: 'us-gaap', scope: 'ANNUAL', source: 'SEC', basis: 'GAAP', sourceUrl: anchor.sourceUrl, period: `${anchor.periodStart} – ${anchor.periodEnd}` };
}
function buildSecCompanyEvidence(payload, options = {}) {
    const asOf = (options.asOf ?? new Date().toISOString()).slice(0, 10), issues = [];
    const points = normalizeFacts(payload, options.cik ?? '', asOf, issues);
    const normalized = financialFacts(points, payload, options.cik ?? '', asOf, issues);
    const annual = points.filter(p => p.scope === 'ANNUAL');
    const quarters = points.filter(p => p.scope === 'QUARTER');
    const instants = points.filter(p => p.scope === 'POINT_IN_TIME');
    const revenueSeries = series(annual.filter(p => p.metric === 'revenue'));
    const annualRevenue = last(revenueSeries);
    const quarterRevenue = newest(quarters.filter(p => p.metric === 'revenue'));
    const currentReporter = newest(points.filter(p => p.metric === 'revenue')) ?? newest(points);
    const reportedCurrency = currentReporter?.currency ?? null;
    const currentBasis = (p) => Boolean(p && currentReporter && p.currency === currentReporter.currency && p.taxonomy === currentReporter.taxonomy);
    const annualAnchor = annualRevenue ?? newest(annual);
    const discontinuedAt = (anchor) => ['discontinuedNetIncome', 'discontinuedOperatingCashFlow'].some(metric => {
        const p = periodFact(points, metric, anchor);
        return p !== null && p.value !== 0;
    });
    const businessFact = (metric, anchor) => {
        const continuing = periodFact(points, metric === 'netIncome' ? 'continuingNetIncome' : 'continuingOperatingCashFlow', anchor);
        return continuing ?? (discontinuedAt(anchor) ? null : periodFact(points, metric, anchor));
    };
    const reportedNetIncome = periodFact(annual, 'netIncome', annualAnchor);
    const annualNetIncome = businessFact('netIncome', annualAnchor);
    const reportedOperatingCashFlow = periodFact(annual, 'operatingCashFlow', annualAnchor);
    const operatingCashFlow = businessFact('operatingCashFlow', annualAnchor);
    const capex = periodFact(annual, 'capex', annualAnchor);
    const operatingIncome = periodFact(annual, 'operatingIncome', annualAnchor);
    const grossProfit = periodFact(annual, 'grossProfit', annualAnchor);
    const instantAnchor = newest(instants.filter(p => currentBasis(p)));
    const cash = periodFact(instants, 'cash', instantAnchor);
    const assets = periodFact(instants, 'assets', instantAnchor);
    const liabilities = periodFact(instants, 'liabilities', instantAnchor);
    const reportedFcf = matches(reportedOperatingCashFlow, capex) ? reportedOperatingCashFlow.value - Math.abs(capex.value) : null;
    // Standard capex tags do not distinguish disposal groups. A continuing CFO
    // cannot be combined with consolidated capex when discontinued activity exists.
    const fcf = !discontinuedAt(annualAnchor) && matches(operatingCashFlow, capex) ? operatingCashFlow.value - Math.abs(capex.value) : null;
    const revGrowth = growth(annualRevenue, priorPeriod(annual, annualRevenue), annual);
    const niGrowth = growth(annualNetIncome, priorPeriod(annual, annualNetIncome), annual);
    const opMargin = ratio(operatingIncome, annualRevenue), grossMargin = ratio(grossProfit, annualRevenue), leverage = ratio(liabilities, assets);
    const reportedMetrics = { currency: annualAnchor?.currency ?? reportedCurrency, revenue: value(annualRevenue), revGrowth, netIncome: value(reportedNetIncome), continuingNetIncome: annualNetIncome?.metric === 'continuingNetIncome' ? annualNetIncome.value : null, niGrowth, fcf: reportedFcf, operatingCashFlow: value(reportedOperatingCashFlow), continuingOperatingCashFlow: operatingCashFlow?.metric === 'continuingOperatingCashFlow' ? operatingCashFlow.value : null, opMargin, grossMargin, leverage };
    // The investment engines' monetary contract is USD. Missing FX normalization is
    // missing coverage, never permission to relabel a foreign-currency amount.
    const annualUsable = currentBasis(annualAnchor) && annualAnchor?.currency === 'USD';
    const rawMetrics = { revenue: annualUsable ? value(annualRevenue) : null, revGrowth: annualUsable ? revGrowth : null, niGrowth: annualUsable ? niGrowth : null, netIncome: annualUsable ? value(annualNetIncome) : null, fcf: annualUsable ? fcf : null, opMargin: annualUsable ? opMargin : null, grossMargin: annualUsable ? grossMargin : null, leverage: instantAnchor?.currency === 'USD' ? leverage : null };
    const qNet = businessFact('netIncome', quarterRevenue), qOp = periodFact(quarters, 'operatingIncome', quarterRevenue), qGross = periodFact(quarters, 'grossProfit', quarterRevenue);
    const latestQuarter = quarterRevenue ? { period: `Quarter ended ${quarterRevenue.periodEnd}`, periodStart: quarterRevenue.periodStart, periodEnd: quarterRevenue.periodEnd, filedAt: quarterRevenue.filedAt, currency: quarterRevenue.currency, unit: quarterRevenue.unit, accession: quarterRevenue.accession, sourceUrl: quarterRevenue.sourceUrl, revenue: quarterRevenue.value, revenueGrowth: growth(quarterRevenue, priorPeriod(quarters, quarterRevenue), quarters), netIncome: value(qNet), opMargin: ratio(qOp, quarterRevenue), grossMargin: ratio(qGross, quarterRevenue) } : null;
    const dilutedShares = annualDilutedShareEvidence(payload, operatingCashFlow ?? reportedOperatingCashFlow, (options.asOf ?? new Date().toISOString()).slice(0, 10));
    const evidenceRows = [annualRevenue && evidence('revenue', annualRevenue), annualNetIncome && evidence('netIncome', annualNetIncome), reportedNetIncome && evidence('reportedNetIncome', reportedNetIncome), operatingCashFlow && evidence('operatingCashFlow', operatingCashFlow), reportedOperatingCashFlow && evidence('reportedOperatingCashFlow', reportedOperatingCashFlow), capex && evidence('capex', capex), cash && evidence('cash', cash), assets && evidence('assets', assets), liabilities && evidence('liabilities', liabilities), operatingIncome && evidence('operatingIncome', operatingIncome), grossProfit && evidence('grossProfit', grossProfit), quarterRevenue && evidence('quarterRevenue', quarterRevenue), qNet && evidence('quarterNetIncome', qNet), dilutedShares].filter((p) => p !== null);
    // Historical rows retain original currencies but only a continuous, comparable
    // current reporting cohort is eligible for growth and durability scoring.
    const historyAnchors = (revenueSeries.length ? revenueSeries : series(annual.filter(p => p.metric === 'netIncome'))).slice(-5);
    let cohortStart = historyAnchors.length;
    if (currentBasis(last(historyAnchors))) {
        cohortStart = Math.max(0, historyAnchors.length - 1);
        while (cohortStart > 0 && comparable(historyAnchors[cohortStart], historyAnchors[cohortStart - 1], annual))
            cohortStart--;
    }
    const hasDiscontinuedReporting = annual.some(p => ['discontinuedNetIncome', 'discontinuedOperatingCashFlow'].includes(p.metric) && p.value !== 0 && sameFiling(p, annualAnchor));
    const history = historyAnchors.map((anchor, index) => {
        const rev = periodFact(annual, 'revenue', anchor), ni = businessFact('netIncome', anchor), ocf = businessFact('operatingCashFlow', anchor);
        return { year: anchor.periodEnd.slice(0, 4), periodStart: anchor.periodStart, periodEnd: anchor.periodEnd, filedAt: anchor.filedAt, currency: anchor.currency, unit: anchor.unit, comparable: index >= cohortStart && (!hasDiscontinuedReporting || sameFiling(anchor, annualAnchor)), revenue: value(rev), netIncome: value(ni), reportedNetIncome: value(periodFact(annual, 'netIncome', anchor)), earningsBasis: ni?.metric === 'continuingNetIncome' ? 'CONTINUING_OPERATIONS' : ni ? 'REPORTED' : 'UNAVAILABLE', operatingCashFlow: value(ocf), cashFlowBasis: ocf?.metric === 'continuingOperatingCashFlow' ? 'CONTINUING_OPERATIONS' : ocf ? 'REPORTED' : 'UNAVAILABLE', evidence: [rev && evidence('revenue', rev), ni && evidence('netIncome', ni), ocf && evidence('operatingCashFlow', ocf)].filter(Boolean) };
    });
    const comparableHistory = history.every(p => p.comparable);
    const currentHistory = history.filter(p => p.comparable);
    const revenueValues = currentHistory.map(p => p.revenue).filter((v) => v !== null), incomeValues = currentHistory.map(p => p.netIncome).filter((v) => v !== null), cashValues = currentHistory.map(p => p.operatingCashFlow).filter((v) => v !== null);
    const revenueTrend = trend(revenueValues), profitTrend = trend(incomeValues);
    const profitableYears = incomeValues.length ? incomeValues.filter(v => v > 0).length / incomeValues.length : null;
    const positiveCashYears = cashValues.length ? cashValues.filter(v => v > 0).length / cashValues.length : null;
    let fiveScore = 50;
    if (revenueTrend === 'Strong')
        fiveScore += 18;
    else if (revenueTrend === 'Improving')
        fiveScore += 10;
    else if (revenueTrend === 'Weakening')
        fiveScore -= 12;
    if (profitableYears !== null)
        fiveScore += (profitableYears - .5) * 28;
    if (positiveCashYears !== null)
        fiveScore += (positiveCashYears - .5) * 18;
    if (currentBasis(annualAnchor) && opMargin !== null)
        fiveScore += Math.max(-10, Math.min(12, (opMargin - 8) * .7));
    if (leverage !== null)
        fiveScore += leverage < 55 ? 8 : leverage > 85 ? -10 : 0;
    const fiveYearRecord = { score: currentHistory.length >= 2 ? clampScore(fiveScore) : null, years: history.length, comparableYears: currentHistory.length, revenueTrend, profitTrend, profitableYears: profitableYears === null ? null : Math.round(profitableYears * 100), positiveCashYears: positiveCashYears === null ? null : Math.round(positiveCashYears * 100), history,
        summary: !comparableHistory ? 'Historical reporting currencies or accounting bases changed. Earlier rows are shown as reported and excluded from current-business growth and durability.' : currentHistory.length < 3 ? 'Limited comparable long-term filing history is available.' : revenueTrend === 'Strong' && profitableYears !== null && profitableYears >= .6 ? 'Revenue history is strong and profitability has been relatively consistent.' : revenueTrend === 'Weakening' ? 'The comparable multi-year revenue record is weakening and deserves closer review.' : 'The comparable business record is mixed; use current fundamentals and catalysts for context.' };
    const fundamentals = [];
    const addAmount = (label, point, detail) => { if (point)
        fundamentals.push({ label, value: money(point.value, point.currency), detail, currency: point.currency, periodStart: point.periodStart, periodEnd: point.periodEnd, filedAt: point.filedAt, accession: point.accession, sourceUrl: point.sourceUrl }); };
    const growthLabel = (v) => v === null ? undefined : `${v >= 0 ? '+' : ''}${v.toFixed(1)}% YoY`;
    addAmount(`Year ended ${annualRevenue?.periodEnd ?? '—'} revenue`, annualRevenue, growthLabel(revGrowth));
    addAmount(`Year ended ${annualNetIncome?.periodEnd ?? '—'} ${annualNetIncome?.metric === 'continuingNetIncome' ? 'continuing-operations ' : ''}net income`, annualNetIncome, growthLabel(niGrowth));
    if (reportedNetIncome && (!annualNetIncome || reportedNetIncome.value !== annualNetIncome.value))
        addAmount(`Year ended ${reportedNetIncome.periodEnd} reported total net income`, reportedNetIncome, 'Reported consolidated amount; current-business profitability uses separately verified continuing-operations evidence.');
    if (fcf !== null && operatingCashFlow)
        fundamentals.push({ label: 'Free cash flow', value: money(fcf, operatingCashFlow.currency), detail: fcf > 0 ? 'Positive' : 'Negative', currency: operatingCashFlow.currency, periodStart: operatingCashFlow.periodStart, periodEnd: operatingCashFlow.periodEnd, filedAt: [operatingCashFlow.filedAt, capex.filedAt].sort().at(-1), basis: 'Operating cash flow less capital expenditure', evidence: [evidence('operatingCashFlow', operatingCashFlow), evidence('capex', capex)] });
    if (fcf === null && reportedFcf !== null && reportedOperatingCashFlow)
        fundamentals.push({ label: 'Reported consolidated free cash flow', value: money(reportedFcf, reportedOperatingCashFlow.currency), detail: 'Includes discontinued activity; excluded from current-business valuation.', currency: reportedOperatingCashFlow.currency, periodStart: reportedOperatingCashFlow.periodStart, periodEnd: reportedOperatingCashFlow.periodEnd, filedAt: reportedOperatingCashFlow.filedAt, evidence: [evidence('reportedOperatingCashFlow', reportedOperatingCashFlow), evidence('capex', capex)] });
    addAmount('Cash & equivalents', cash);
    if (opMargin !== null)
        fundamentals.push({ label: 'Operating margin', value: `${opMargin.toFixed(1)}%`, periodStart: annualRevenue?.periodStart, periodEnd: annualRevenue?.periodEnd });
    if (grossMargin !== null)
        fundamentals.push({ label: 'Gross margin', value: `${grossMargin.toFixed(1)}%`, periodStart: annualRevenue?.periodStart, periodEnd: annualRevenue?.periodEnd });
    if (leverage !== null)
        fundamentals.push({ label: 'Liabilities / assets', value: `${leverage.toFixed(1)}%`, periodEnd: assets?.periodEnd });
    const reasons = [], positiveReasons = [], riskReasons = [];
    let currentScore = 0, observations = 0;
    const add = (amount, reason) => { currentScore += amount; reasons.push(reason); (amount > 0 ? positiveReasons : riskReasons).push(reason); };
    if (currentBasis(annualAnchor)) {
        if (revGrowth !== null) {
            observations++;
            if (revGrowth > 15)
                add(2, 'Revenue growth is strong.');
            else if (revGrowth > 0)
                add(1, 'Revenue is growing.');
            else if (revGrowth < 0)
                add(-1, 'Revenue growth is negative.');
        }
        if (annualNetIncome) {
            observations++;
            if (annualNetIncome.value > 0)
                add(1, 'The company is profitable on the latest comparable annual filing.');
            else if (annualNetIncome.value < 0)
                add(-1, 'Latest comparable annual net income is negative.');
        }
        if (fcf !== null) {
            observations++;
            if (fcf > 0)
                add(1, 'Free cash flow is positive.');
            else if (fcf < 0)
                add(-1, 'Free cash flow is negative.');
        }
        if (opMargin !== null) {
            observations++;
            if (opMargin > 12)
                add(1, 'Operating margin is healthy.');
        }
    }
    if (leverage !== null) {
        observations++;
        if (leverage < 65)
            add(1, 'Balance-sheet leverage is moderate.');
        else if (leverage > 85)
            add(-1, 'Liabilities are high relative to assets.');
    }
    if (matches(cash, liabilities) && cash.value > liabilities.value * .25) {
        observations++;
        add(1, 'Cash provides a meaningful balance-sheet cushion.');
    }
    const currentFundamentalScore = observations ? clampScore(50 + currentScore * 8) : null;
    const businessScore = currentFundamentalScore === null ? fiveYearRecord.score : fiveYearRecord.score === null ? currentFundamentalScore : clampScore(currentFundamentalScore * .45 + fiveYearRecord.score * .55);
    const fundamentalSignal = { label: businessScore === null ? 'Limited' : businessScore >= 72 ? 'Strong' : businessScore < 45 ? 'Weak / watch' : 'Mixed', tone: businessScore === null ? 'neutral' : businessScore >= 72 ? 'good' : businessScore < 45 ? 'bad' : 'mid', score: businessScore, currentScore: currentFundamentalScore, reasons, positiveReasons, riskReasons };
    const warnings = issues.map(issue => issue.reason);
    if (reportedCurrency && reportedCurrency !== 'USD')
        warnings.push(`Financial statements are reported in ${reportedCurrency}. USD valuation inputs are unavailable because no verified currency conversion is applied.`);
    if (!comparableHistory)
        warnings.push('Reporting currency, taxonomy, concept or annual coverage changed. Prior reporting periods may describe a different business basis; unbridged periods are excluded from growth and durability.');
    if (hasDiscontinuedReporting)
        warnings.push('Discontinued operations are present. Current-business profitability and cash-generation use continuing-operations facts; only periods in the latest comparable reporting cohort support durability. Consolidated FCF is excluded from valuation when continuing capex cannot be verified.');
    if (annualAnchor && !currentBasis(annualAnchor))
        warnings.push('The latest annual statements do not match the current reporting basis. Current annual valuation and quality inputs are unavailable.');
    if (!annualRevenue)
        warnings.push('No verified full-year revenue period is available. Partial-year disclosures are not annualized.');
    if (!quarterRevenue)
        warnings.push('No verified standalone quarter is available. Year-to-date disclosures are not treated as quarterly results.');
    const available = Object.values(rawMetrics).filter(v => v !== null).length, total = Object.keys(rawMetrics).length;
    if (available < total)
        warnings.push('Some metrics lack matching periods, currencies or source facts. Missing evidence lowers coverage, not business quality.');
    const dataQuality = { contractVersion: 'sec-company-evidence-v3', status: available === 0 ? 'UNAVAILABLE' : available >= 6 ? 'SUFFICIENT' : 'PARTIAL', reportedCurrency, valuationCurrency: 'USD', earningsBasis: annualNetIncome?.metric === 'continuingNetIncome' ? 'CONTINUING_OPERATIONS' : annualNetIncome ? 'REPORTED' : 'UNAVAILABLE', cashFlowBasis: operatingCashFlow?.metric === 'continuingOperatingCashFlow' ? 'CONTINUING_OPERATIONS' : operatingCashFlow ? 'REPORTED' : 'UNAVAILABLE', comparableHistory, warnings, coverage: { available, total, percent: Math.round(available / total * 100) }, latestPeriodEnd: currentReporter?.periodEnd ?? null, latestFiledAt: currentReporter?.filedAt ?? null };
    const financials = { version: 'financial-evidence-v4', asOf, availabilityBasis: 'SEC filing date; intraday acceptance time unavailable', facts: normalized, issues };
    return { evidence: evidenceRows, financials, latestQuarter, fundamentals, fundamentalSignal, fiveYearRecord, rawMetrics, reportedMetrics, dataQuality };
}
