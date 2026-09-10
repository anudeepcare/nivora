"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSecCompanyFacts = normalizeSecCompanyFacts;
exports.deriveSecAnnualMetrics = deriveSecAnnualMetrics;
exports.normalizeAndDeriveSecCompanyFacts = normalizeAndDeriveSecCompanyFacts;
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const dateLike = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x);
const CONCEPTS = {
    RevenueFromContractWithCustomerExcludingAssessedTax: { metric: 'revenue', units: ['USD'], priority: 1 },
    Revenues: { metric: 'revenue', units: ['USD'], priority: 2 },
    SalesRevenueNet: { metric: 'revenue', units: ['USD'], priority: 3 },
    GrossProfit: { metric: 'gross_profit', units: ['USD'], priority: 1 },
    OperatingIncomeLoss: { metric: 'operating_income', units: ['USD'], priority: 1 },
    NetIncomeLoss: { metric: 'net_income', units: ['USD'], priority: 1 },
    ProfitLoss: { metric: 'net_income', units: ['USD'], priority: 2 },
    NetCashProvidedByUsedInOperatingActivities: { metric: 'operating_cash_flow', units: ['USD'], priority: 1 },
    PaymentsToAcquirePropertyPlantAndEquipment: { metric: 'capex', units: ['USD'], priority: 1 },
    Assets: { metric: 'total_assets', units: ['USD'], priority: 1 },
    AssetsCurrent: { metric: 'current_assets', units: ['USD'], priority: 1 },
    Liabilities: { metric: 'total_liabilities', units: ['USD'], priority: 1 },
    LiabilitiesCurrent: { metric: 'current_liabilities', units: ['USD'], priority: 1 },
    StockholdersEquity: { metric: 'stockholders_equity', units: ['USD'], priority: 1 },
    CashAndCashEquivalentsAtCarryingValue: { metric: 'cash_and_equivalents', units: ['USD'], priority: 1 },
    LongTermDebtCurrent: { metric: 'long_term_debt_current', units: ['USD'], priority: 1 },
    LongTermDebtNoncurrent: { metric: 'long_term_debt_noncurrent', units: ['USD'], priority: 1 },
    LongTermDebt: { metric: 'long_term_debt', units: ['USD'], priority: 2 },
    EarningsPerShareDiluted: { metric: 'eps_diluted', units: ['USD/shares', 'USD / shares'], priority: 1 },
    CommonStockSharesOutstanding: { metric: 'shares_outstanding', units: ['shares'], priority: 1 },
    EntityCommonStockSharesOutstanding: { metric: 'shares_outstanding', units: ['shares'], priority: 2 },
    ResearchAndDevelopmentExpense: { metric: 'rd_expense', units: ['USD'], priority: 1 },
    SellingGeneralAndAdministrativeExpense: { metric: 'sga_expense', units: ['USD'], priority: 1 }
};
function entriesForConcept(concept, spec) {
    const out = [];
    for (const unit of spec.units) {
        const rows = concept?.units?.[unit];
        if (Array.isArray(rows))
            out.push(...rows);
    }
    return out;
}
function isAnnualForm(r) {
    const form = String(r.form || '').toUpperCase();
    const fp = String(r.fp || '').toUpperCase();
    return ['10-K', '10-K/A', '20-F', '20-F/A', '40-F', '40-F/A'].includes(form) && (fp === 'FY' || fp === '');
}
function normalizeSecCompanyFacts(symbol, payload) {
    const s = String(symbol || '').trim().toUpperCase();
    if (!s)
        throw new Error('SEC symbol is required.');
    if (!payload?.facts || typeof payload.facts !== 'object')
        throw new Error(`SEC Company Facts response for ${s} has no facts object.`);
    const rows = [];
    for (const taxonomy of ['us-gaap', 'ifrs-full']) {
        const facts = payload.facts[taxonomy];
        if (!facts)
            continue;
        for (const [conceptName, spec] of Object.entries(CONCEPTS)) {
            const concept = facts[conceptName];
            if (!concept)
                continue;
            for (const row of entriesForConcept(concept, spec)) {
                if (row?.val == null || !finite(Number(row.val)))
                    continue;
                if (!dateLike(row?.filed))
                    throw new Error(`SEC fact ${conceptName} for ${s} is missing filed date; public availability cannot be inferred from period end.`);
                rows.push({ symbol: s, metric: spec.metric, value: Number(row.val), periodEnd: dateLike(row?.end) ? String(row.end).slice(0, 10) : null, availableAt: String(row.filed).slice(0, 10), form: row?.form ? String(row.form) : null, fp: row?.fp ? String(row.fp) : null, accession: row?.accn ? String(row.accn) : null, start: dateLike(row?.start) ? String(row.start).slice(0, 10) : null, concept: conceptName, taxonomy, priority: spec.priority });
            }
        }
    }
    rows.sort((a, b) => a.availableAt.localeCompare(b.availableAt) || (a.periodEnd ?? '').localeCompare(b.periodEnd ?? '') || a.metric.localeCompare(b.metric) || (a.priority ?? 99) - (b.priority ?? 99) || (a.accession ?? '').localeCompare(b.accession ?? '') || (a.concept ?? '').localeCompare(b.concept ?? ''));
    // Collapse concept aliases inside the same public filing/period to a deterministic preferred concept.
    const best = new Map();
    for (const r of rows) {
        const k = [r.symbol, r.metric, r.periodEnd ?? '', r.availableAt, r.form ?? '', r.fp ?? '', r.accession ?? ''].join('|');
        const prev = best.get(k);
        if (!prev || (r.priority ?? 99) < (prev.priority ?? 99))
            best.set(k, r);
    }
    return [...best.values()].sort((a, b) => a.availableAt.localeCompare(b.availableAt) || (a.periodEnd ?? '').localeCompare(b.periodEnd ?? '') || a.metric.localeCompare(b.metric) || (a.accession ?? '').localeCompare(b.accession ?? ''));
}
const pct = (a, b) => b !== 0 ? (a / b - 1) * 100 : NaN;
const ratio = (a, b, scale = 1) => b !== 0 ? a / b * scale : NaN;
function latestForPeriod(rows, metric, periodEnd, availableAt) {
    return rows.filter(r => r.metric === metric && r.periodEnd === periodEnd && r.availableAt <= availableAt && isAnnualForm(r)).sort((a, b) => a.availableAt.localeCompare(b.availableAt) || (a.priority ?? 99) - (b.priority ?? 99)).at(-1);
}
function annualPeriodEnds(rows, metric, availableAt) {
    return [...new Set(rows.filter(r => r.metric === metric && r.periodEnd && r.availableAt <= availableAt && isAnnualForm(r)).map(r => r.periodEnd))].sort();
}
function deriveSecAnnualMetrics(symbol, raw) {
    const s = symbol.toUpperCase();
    const annualRevenueRows = raw.filter(r => r.metric === 'revenue' && r.periodEnd && isAnnualForm(r));
    const anchors = [...new Map(annualRevenueRows.map(r => [[r.periodEnd, r.availableAt].join('|'), r])).values()].sort((a, b) => a.availableAt.localeCompare(b.availableAt) || (a.periodEnd ?? '').localeCompare(b.periodEnd ?? ''));
    const out = [];
    for (const anchor of anchors) {
        const availableAt = anchor.availableAt, period = anchor.periodEnd;
        const periods = annualPeriodEnds(raw, 'revenue', availableAt);
        const idx = periods.indexOf(period);
        if (idx < 0)
            continue;
        const priorPeriod = idx > 0 ? periods[idx - 1] : null, prior2Period = idx > 1 ? periods[idx - 2] : null;
        const currentRevenue = latestForPeriod(raw, 'revenue', period, availableAt);
        if (!currentRevenue)
            continue;
        const emit = (metric, value) => { if (finite(value))
            out.push({ symbol: s, metric, value: +value.toFixed(6), periodEnd: period, availableAt }); };
        if (priorPeriod) {
            const prior = latestForPeriod(raw, 'revenue', priorPeriod, availableAt);
            if (prior) {
                const g = pct(currentRevenue.value, prior.value);
                emit('revenue_growth', g);
                if (prior2Period) {
                    const prior2 = latestForPeriod(raw, 'revenue', prior2Period, availableAt);
                    if (prior2)
                        emit('revenue_acceleration', g - pct(prior.value, prior2.value));
                }
            }
        }
        const get = (metric) => latestForPeriod(raw, metric, period, availableAt);
        const gross = get('gross_profit'), op = get('operating_income'), ni = get('net_income'), cfo = get('operating_cash_flow'), capex = get('capex'), assets = get('total_assets'), liab = get('total_liabilities'), eq = get('stockholders_equity'), cash = get('cash_and_equivalents'), debtN = get('long_term_debt_noncurrent'), debt = get('long_term_debt'), debtC = get('long_term_debt_current'), eps = get('eps_diluted'), shares = get('shares_outstanding'), ca = get('current_assets'), cl = get('current_liabilities');
        if (gross)
            emit('gross_margin', ratio(gross.value, currentRevenue.value, 100));
        if (op)
            emit('operating_margin', ratio(op.value, currentRevenue.value, 100));
        if (cfo) {
            const fcf = cfo.value - (capex?.value ?? 0);
            emit('fcf_margin', ratio(fcf, currentRevenue.value, 100));
            if (ni)
                emit('cash_conversion', ratio(cfo.value, Math.abs(ni.value)));
        }
        if (ni && eq)
            emit('roe', ratio(ni.value, eq.value, 100));
        if (liab && assets)
            emit('leverage', ratio(liab.value, assets.value));
        if (ca && cl)
            emit('liquidity', ratio(ca.value, cl.value));
        if (cash) {
            const td = (debtN?.value ?? 0) + (debtC?.value ?? 0) + (debt?.value ?? 0);
            emit('net_cash_debt', cash.value - td);
        }
        if (priorPeriod) {
            const p = (metric) => latestForPeriod(raw, metric, priorPeriod, availableAt);
            const pe = p('eps_diluted'), ps = p('shares_outstanding'), pcfo = p('operating_cash_flow'), pcap = p('capex');
            if (eps && pe)
                emit('eps_growth', pct(eps.value, pe.value));
            if (shares && ps)
                emit('dilution_rate', pct(shares.value, ps.value));
            if (cfo && pcfo) {
                const fcf = cfo.value - (capex?.value ?? 0), pfcf = pcfo.value - (pcap?.value ?? 0);
                emit('fcf_growth', pct(fcf, pfcf));
            }
        }
    }
    const byKey = new Map();
    for (const r of out.sort((a, b) => a.availableAt.localeCompare(b.availableAt) || a.metric.localeCompare(b.metric) || (a.periodEnd ?? '').localeCompare(b.periodEnd ?? '')))
        byKey.set([r.symbol, r.metric, r.periodEnd ?? '', r.availableAt].join('|'), r);
    return [...byKey.values()];
}
function normalizeAndDeriveSecCompanyFacts(symbol, payload) {
    const raw = normalizeSecCompanyFacts(symbol, payload), derived = deriveSecAnnualMetrics(symbol, raw);
    return { raw, derived, all: [...raw, ...derived].sort((a, b) => a.availableAt.localeCompare(b.availableAt) || a.metric.localeCompare(b.metric) || (a.periodEnd ?? '').localeCompare(b.periodEnd ?? '')) };
}
