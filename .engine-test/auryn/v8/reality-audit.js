"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.V8_GOLDEN_UNIVERSE = void 0;
exports.runV8RealityAudit = runV8RealityAudit;
const classification_1 = require("../v4/classification");
const model_registry_1 = require("../v4/model-registry");
const valuation_registry_1 = require("../v6/valuation-registry");
const evidence = [{ id: 'golden-profile', key: 'profile', source: 'PROVIDER', scope: 'POINT_IN_TIME', asOf: '2026-09-07', validationState: 'MEASURED' }];
const f = (symbol, expectedModel, allowedLifecycle, description, sector, industry, revenueGrowth, profitable, assetType = 'stock') => ({ symbol, expectedModel, allowedLifecycle, input: { assetType, sector, industry, name: symbol, description, revenue: 1_000, revenueGrowth, operatingMargin: profitable ? 12 : -25, fcf: profitable ? 80 : -80, profitable } });
const list = (symbols, model, lifecycle, description, sector, industry, growth, profitable, assetType = 'stock') => symbols.map(s => f(s, model, lifecycle, description, sector, industry, growth, profitable, assetType));
exports.V8_GOLDEN_UNIVERSE = [
    ...list(['MSFT', 'CRM', 'NOW', 'ORCL', 'ADBE', 'DDOG', 'SNOW'], 'SAAS_SOFTWARE', ['SCALE'], 'cloud software subscription software platform', 'Technology', 'Software', 24, true),
    ...list(['CRWD', 'PANW', 'ZS'], 'SAAS_SOFTWARE', ['SCALE'], 'cybersecurity platform and subscription security software', 'Technology', 'Software', 24, true),
    ...list(['NVDA', 'AMD', 'QCOM', 'ARM'], 'SEMICONDUCTOR_DESIGNER', ['INFLECTION'], 'fabless semiconductor design and accelerated compute chip designer', 'Technology', 'Semiconductors', 38, true),
    ...list(['MRVL', 'CRDO', 'AVGO'], 'NETWORKING_COMPUTE_INFRA', ['INFLECTION'], 'networking silicon ethernet optical interconnect compute fabric', 'Technology', 'Semiconductors', 38, true),
    ...list(['MU', 'SNDK', 'WDC'], 'SEMICONDUCTOR_MEMORY_CYCLICAL', ['INFLECTION'], 'DRAM NAND memory semiconductor producer', 'Technology', 'Semiconductors', 38, true),
    ...list(['IREN', 'CIFR', 'NBIS'], 'AI_DATA_CENTER_INFRA', ['HYPERGROWTH'], 'GPU cloud AI data center HPC hosting with secured power and compute capacity', 'Technology', 'Data Infrastructure', 55, false),
    ...list(['BE', 'VRT', 'ETN', 'CEG', 'VST'], 'POWER_UTILITY_INFRA', ['SCALE'], 'electrical power infrastructure power management and distributed power generation', 'Industrials', 'Electrical Equipment', 24, true),
    ...list(['DLR', 'EQIX'], 'REIT', ['COMPOUNDER'], 'real estate investment trust owning global data centers and colocation facilities', 'Real Estate', 'Specialized REITs', 9, true, 'reit'),
    ...list(['HIMS', 'TDOC', 'DOCS', 'TEM'], 'DIGITAL_HEALTH_PLATFORM', ['SCALE'], 'digital health telehealth consumer health subscription platform connecting patients and clinicians', 'Health Care', 'Health Care Technology', 25, true),
    ...list(['LLY', 'MRK', 'VRTX'], 'BIOTECH_PHARMA', ['COMPOUNDER'], 'pharmaceutical biotech therapeutics and drug development portfolio', 'Health Care', 'Biotechnology', 12, true),
    ...list(['PRCT', 'ISRG', 'DXCM'], 'MEDTECH', ['SCALE'], 'medical device surgical robotics diagnostic device platform', 'Health Care', 'Health Care Equipment', 18, true),
    ...list(['ASTS', 'RKLB', 'LUNR', 'RDW', 'PL'], 'SPACE_SATELLITE', ['VALIDATION'], 'satellite constellation space systems commercial deployment launch milestones and carrier partners', 'Industrials', 'Aerospace & Space', 100, false),
    ...list(['LMT', 'NOC', 'RTX', 'AVAV', 'KTOS'], 'DEFENSE', ['COMPOUNDER'], 'defense military systems unmanned aircraft and aerospace equipment', 'Industrials', 'Aerospace & Defense', 9, true),
    ...list(['JPM', 'BAC', 'GS', 'MS', 'C'], 'BANK', ['COMPOUNDER'], 'commercial bank and investment banking financial services', 'Financial Services', 'Banks', 8, true),
    ...list(['V', 'MA', 'PYPL', 'SOFI', 'COIN'], 'FINTECH_PAYMENTS', ['SCALE'], 'fintech payments digital wallet payment network and digital financial platform', 'Financial Services', 'Fintech', 20, true),
    ...list(['AMZN', 'WMT', 'COST', 'HD', 'NKE', 'SBUX', 'MCD', 'TGT', 'LULU', 'CELH'], 'CONSUMER', ['MATURITY'], 'consumer retail e-commerce restaurant beverage apparel business', 'Consumer Cyclical', 'Retail', 6, true),
    ...list(['CAT', 'DE', 'HON', 'GE', 'UPS', 'FDX', 'URI', 'PH', 'ROK', 'EMR'], 'INDUSTRIAL', ['COMPOUNDER'], 'industrial machinery automation logistics equipment and manufacturing systems', 'Industrials', 'Industrial Machinery', 9, true),
    ...list(['XOM', 'CVX', 'COP', 'SLB', 'LNG'], 'ENERGY', ['MATURITY'], 'oil gas LNG upstream midstream refining and energy services', 'Energy', 'Oil & Gas', 5, true),
    ...list(['FCX', 'NEM', 'SCCO', 'ALB', 'MP'], 'MINER_COMMODITY', ['MATURITY'], 'mining miner copper gold lithium producer and rare earth resources', 'Materials', 'Mining', 5, true),
    ...list(['O', 'PLD', 'AMT', 'WELL', 'SPG'], 'REIT', ['COMPOUNDER'], 'real estate investment trust REIT owning income-producing properties', 'Real Estate', 'REITs', 8, true, 'reit'),
    ...list(['PGR', 'CB', 'MET', 'AIG', 'ALL'], 'INSURER', ['MATURITY'], 'insurance insurer underwriting and risk protection products', 'Financial Services', 'Insurance', 6, true),
];
const expectedAnalyst = {
    SAAS_SOFTWARE: 'software-marketplace', DIGITAL_HEALTH_PLATFORM: 'digital-health-platform', SEMICONDUCTOR_DESIGNER: 'semiconductor-designer-networking', NETWORKING_COMPUTE_INFRA: 'semiconductor-designer-networking', SEMICONDUCTOR_MEMORY_CYCLICAL: 'semiconductor-memory-cycle', AI_DATA_CENTER_INFRA: 'ai-power-infrastructure', POWER_UTILITY_INFRA: 'ai-power-infrastructure', SPACE_SATELLITE: 'frontier-pre-scale', DEFENSE: 'general-compounder', BANK: 'financials', FINTECH_PAYMENTS: 'software-marketplace', CONSUMER: 'general-compounder', INDUSTRIAL: 'general-compounder', ENERGY: 'energy-miner-cycle', MINER_COMMODITY: 'energy-miner-cycle', REIT: 'reit', INSURER: 'financials', BIOTECH_PHARMA: 'biotech-pre-profit', MEDTECH: 'biotech-pre-profit'
};
const expectedValuation = {
    SAAS_SOFTWARE: 'GROWTH_EV_SALES_FCF', DIGITAL_HEALTH_PLATFORM: 'GROWTH_EV_SALES_FCF', SEMICONDUCTOR_DESIGNER: 'DCF_FCF_EARNINGS', NETWORKING_COMPUTE_INFRA: 'AI_INFRA_SOTP_CAPACITY', SEMICONDUCTOR_MEMORY_CYCLICAL: 'CYCLE_NORMALIZED', AI_DATA_CENTER_INFRA: 'AI_INFRA_SOTP_CAPACITY', POWER_UTILITY_INFRA: 'AI_INFRA_SOTP_CAPACITY', SPACE_SATELLITE: 'FRONTIER_SCENARIO_RUNWAY', DEFENSE: 'DCF_FCF_EARNINGS', BANK: 'BANK_PB_ROE_NIM', FINTECH_PAYMENTS: 'GROWTH_EV_SALES_FCF', CONSUMER: 'DCF_FCF_EARNINGS', INDUSTRIAL: 'DCF_FCF_EARNINGS', ENERGY: 'ENERGY_CYCLE_NAV', MINER_COMMODITY: 'ENERGY_CYCLE_NAV', REIT: 'REIT_FFO_AFFO', INSURER: 'BANK_PB_ROE_NIM', BIOTECH_PHARMA: 'BIOTECH_SCENARIO_PIPELINE', MEDTECH: 'BIOTECH_SCENARIO_PIPELINE'
};
function runV8RealityAudit() {
    const violations = [];
    const rows = [];
    for (const x of exports.V8_GOLDEN_UNIVERSE) {
        const c = (0, classification_1.classifyV4Security)({ ...x.input, evidence });
        const analyst = (0, model_registry_1.selectAnalystModel)(c).definition.id;
        const valuation = (0, valuation_registry_1.resolveValuationMethod)(c).method;
        const local = [];
        if (c.businessModel !== x.expectedModel)
            local.push({ symbol: x.symbol, code: 'BUSINESS_MODEL', message: `expected ${x.expectedModel}, got ${c.businessModel}` });
        if (!x.allowedLifecycle.includes(c.lifecycle))
            local.push({ symbol: x.symbol, code: 'LIFECYCLE', message: `expected ${x.allowedLifecycle.join('|')}, got ${c.lifecycle}` });
        if (c.lifecycle === 'MATURITY' && x.allowedLifecycle.includes('UNKNOWN'))
            local.push({ symbol: x.symbol, code: 'MATURITY_FALLBACK', message: 'missing lifecycle evidence must not default to MATURITY' });
        const ea = expectedAnalyst[x.expectedModel];
        if (ea && analyst !== ea)
            local.push({ symbol: x.symbol, code: 'ANALYST_MODEL', message: `expected analyst ${ea}, got ${analyst}` });
        const ev = expectedValuation[x.expectedModel];
        if (ev && valuation !== ev)
            local.push({ symbol: x.symbol, code: 'VALUATION_METHOD', message: `expected valuation ${ev}, got ${valuation}` });
        violations.push(...local);
        rows.push({ symbol: x.symbol, expectedModel: x.expectedModel, actualModel: c.businessModel, lifecycle: c.lifecycle, analystModel: analyst, valuationMethod: valuation, passed: local.length === 0 });
    }
    return { total: exports.V8_GOLDEN_UNIVERSE.length, passed: rows.filter(r => r.passed).length, violations, rows };
}
