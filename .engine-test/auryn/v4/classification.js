"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyV4Security = classifyV4Security;
const finite = (v) => typeof v === "number" && Number.isFinite(v);
const text = (x) => [x.name, x.description, x.sector, x.industry, x.strategicTheme, x.archetypeHint].filter(Boolean).join(" ").toLowerCase();
const rules = [
    ["SPACE_SATELLITE", /satellite|constellation|direct[- ]to[- ]device|space[- ]based|launch services|space systems/],
    ["DIGITAL_HEALTH_PLATFORM", /digital health|telehealth|telemedicine|virtual care|consumer health platform|health care technology|healthcare technology|health information services|health(?:care)? platform|health and wellness platform|direct[- ]to[- ]consumer health|subscription health|online health(?:care)?|personalized health(?:care)? platform/],
    ["MEDTECH", /medical device|medtech|diagnostic device|surgical robot|robotic surgery|medical equipment/],
    ["POWER_UTILITY_INFRA", /utility|power generation|fuel cell|grid|electric power|electrical power|distributed power|onsite power|power management|power infrastructure/],
    ["AI_DATA_CENTER_INFRA", /ai cloud|gpu cloud|data cent(?:er|re)|hyperscale|gpu compute capacity|ai infrastructure hosting|high[- ]performance computing|\bhpc\b/],
    ["SEMICONDUCTOR_MEMORY_CYCLICAL", /\bdram\b|\bnand\b|memory semiconductor|memory producer/],
    ["NETWORKING_COMPUTE_INFRA", /networking silicon|ethernet|optical interconnect|switching|compute fabric/],
    ["SEMICONDUCTOR_DESIGNER", /fabless|semiconductor design|\bgpu\b|accelerator|chip designer|accelerated compute/],
    ["MARKETPLACE_ADTECH", /ad[- ]tech|advertising platform|marketplace|app monetization/],
    ["SAAS_SOFTWARE", /\bsaas\b|software platform|cloud software|subscription software|cybersecurity platform|security software/],
    ["FINTECH_PAYMENTS", /payments|fintech|merchant acquiring|digital wallet|payment network|digital asset platform/],
    ["BIOTECH_PHARMA", /biotech|biopharma|pharmaceutical|pharma|therapeutic(?:s)?|drug development|drug discovery|clinical[- ]stage/],
    ["MINER_COMMODITY", /mining|miner|copper producer|gold producer|lithium producer|rare earth/],
    ["ENERGY", /\boil\b|\bgas\b|\blng\b|upstream|midstream|refining|oilfield services/],
    ["DEFENSE", /defense|aerospace systems|missile|military systems|unmanned aircraft/],
    ["REIT", /\breit\b|real estate investment trust/],
    ["BANK", /\bbank\b|banking|investment banking/],
    ["INSURER", /insurance|insurer|underwriting/],
    ["CONSUMER", /consumer|retail|restaurant|beverage|apparel|e[- ]commerce/],
    ["INDUSTRIAL", /industrial|machinery|logistics equipment|automation|electrical equipment/]
];
function classifyBusinessModel(input) {
    const hint = String(input.archetypeHint || "").toLowerCase();
    const hintMap = {
        ai_infrastructure: "AI_DATA_CENTER_INFRA", infrastructure: "POWER_UTILITY_INFRA", power_infrastructure: "POWER_UTILITY_INFRA",
        semiconductor_cyclical: "SEMICONDUCTOR_MEMORY_CYCLICAL",
        bank: "BANK", insurer: "INSURER", biotech: "BIOTECH_PHARMA", digital_health: "DIGITAL_HEALTH_PLATFORM", miner: "MINER_COMMODITY", pre_scale: "SPACE_SATELLITE"
    };
    const t = text(input);
    const industry = (input.industry || "").toLowerCase();
    const sector = (input.sector || "").toLowerCase();
    const asset = (input.assetType || "").toLowerCase();
    // Legal/entity identity outranks thematic descriptions. A data-center REIT is still a REIT.
    if (asset.includes("reit") || industry.includes("reit") || /real estate investment trust|\breit\b/.test(t))
        return { model: "REIT", specific: true };
    if (industry.includes("insurance") || /insurer|insurance underwriting/.test(t))
        return { model: "INSURER", specific: true };
    if (industry.includes("bank") || /commercial bank|investment bank|banking services/.test(t))
        return { model: "BANK", specific: true };
    // Explicit legacy archetype hints are accepted only after legal/entity identity checks;
    // generic hints such as "general"/"compounder" are intentionally not mapped.
    if (hintMap[hint])
        return { model: hintMap[hint], specific: true };
    // Source-backed descriptions outrank generic fallback classification.
    for (const [model, re] of rules) {
        if (re.test(t))
            return { model, specific: true };
    }
    if (industry.includes("health care technology") || industry.includes("healthcare technology") || industry.includes("health information"))
        return { model: "DIGITAL_HEALTH_PLATFORM", specific: true };
    if (industry.includes("medical") || industry.includes("health care equipment"))
        return { model: "MEDTECH", specific: true };
    if (industry.includes("software"))
        return { model: "SAAS_SOFTWARE", specific: true };
    if (industry.includes("semiconductor"))
        return { model: "SEMICONDUCTOR_DESIGNER", specific: true };
    if (sector.includes("financial"))
        return { model: "BANK", specific: true };
    if (sector.includes("real estate"))
        return { model: "REIT", specific: true };
    if (sector.includes("health") && industry.includes("biotech"))
        return { model: "BIOTECH_PHARMA", specific: true };
    return { model: "GENERAL_COMPOUNDER", specific: false };
}
function lifecycleOf(x, businessModel) {
    const rev = finite(x.revenue) ? Number(x.revenue) : null;
    const growth = finite(x.revenueGrowth) ? Number(x.revenueGrowth) : null;
    const op = finite(x.operatingMargin) ? Number(x.operatingMargin) : null;
    const fcf = finite(x.fcf) ? Number(x.fcf) : null;
    const t = text(x);
    if (rev != null && rev <= 0 && x.profitable === false)
        return "PRE_COMMERCIAL";
    if (x.profitable === false && ["SPACE_SATELLITE", "BIOTECH_PHARMA"].includes(businessModel)) {
        if (growth != null && growth > 40)
            return "VALIDATION";
        if (/commercial deployment|commercialization|launch milestone|carrier partner|clinical trial|clinical[- ]stage|regulatory milestone/.test(t))
            return "VALIDATION";
        if (rev != null && rev > 0)
            return "VALIDATION";
        return "UNKNOWN";
    }
    if (growth != null && growth >= 35 && ((op != null && op > 0) || (fcf != null && fcf > 0)))
        return "INFLECTION";
    if (growth != null && growth >= 30)
        return "HYPERGROWTH";
    if (growth != null && growth >= 15 && x.profitable !== false)
        return "SCALE";
    if (growth != null && growth >= 7 && x.profitable !== false)
        return "COMPOUNDER";
    if (growth != null && growth < 0)
        return "DECLINE_OR_REINVENTION";
    if (growth != null && growth < 7 && x.profitable === true)
        return "MATURITY";
    return "UNKNOWN";
}
function assetClassOf(input, model) {
    const a = (input.assetType || "").toLowerCase();
    if (a.includes("crypto"))
        return "CRYPTO";
    if (a.includes("etf"))
        return "ETF";
    if (model === "REIT")
        return "REIT";
    if (model === "BANK" || model === "INSURER" || model === "FINTECH_PAYMENTS")
        return "FINANCIAL";
    if (model === "BIOTECH_PHARMA" || model === "MEDTECH")
        return "BIOTECH";
    if (model === "MINER_COMMODITY")
        return "MINER";
    if (a === "stock" || a === "equity" || !a)
        return "EQUITY";
    return "OTHER";
}
function capitalIntensityOf(model) {
    if (["SPACE_SATELLITE", "AI_DATA_CENTER_INFRA", "POWER_UTILITY_INFRA", "MINER_COMMODITY", "ENERGY"].includes(model))
        return "EXTREME";
    if (["SEMICONDUCTOR_MEMORY_CYCLICAL", "INDUSTRIAL", "REIT", "DEFENSE"].includes(model))
        return "HIGH";
    if (["SEMICONDUCTOR_DESIGNER", "NETWORKING_COMPUTE_INFRA", "BIOTECH_PHARMA", "MEDTECH", "BANK", "INSURER"].includes(model))
        return "MEDIUM";
    if (["SAAS_SOFTWARE", "MARKETPLACE_ADTECH", "FINTECH_PAYMENTS", "DIGITAL_HEALTH_PLATFORM"].includes(model))
        return "LOW";
    return "UNKNOWN";
}
function cyclicalityOf(model) {
    if (model === "SEMICONDUCTOR_MEMORY_CYCLICAL")
        return "HIGHLY_CYCLICAL";
    if (["ENERGY", "MINER_COMMODITY", "INDUSTRIAL", "SEMICONDUCTOR_DESIGNER", "NETWORKING_COMPUTE_INFRA"].includes(model))
        return "CYCLICAL";
    if (["POWER_UTILITY_INFRA", "INSURER", "BIOTECH_PHARMA", "MEDTECH"].includes(model))
        return "DEFENSIVE";
    if (["SAAS_SOFTWARE", "MARKETPLACE_ADTECH", "FINTECH_PAYMENTS", "DIGITAL_HEALTH_PLATFORM", "BANK", "REIT", "CONSUMER", "AI_DATA_CENTER_INFRA", "SPACE_SATELLITE"].includes(model))
        return "MODERATE";
    return "UNKNOWN";
}
function profitabilityOf(input, lifecycle) {
    if (input.revenue != null && input.revenue <= 0 && input.profitable === false)
        return "PRE_REVENUE";
    if (input.profitable === false)
        return "PRE_PROFIT";
    if (input.profitable === true && ["MATURITY", "COMPOUNDER"].includes(lifecycle))
        return "MATURE";
    if (input.profitable === true)
        return "PROFITABLE";
    if (finite(input.operatingMargin))
        return input.operatingMargin > 0 ? "PROFITABLE" : "PRE_PROFIT";
    return "UNKNOWN";
}
function classifyV4Security(input) {
    const { model, specific } = classifyBusinessModel(input);
    const lifecycle = lifecycleOf(input, model);
    let confidence = 0.30;
    if (input.industry)
        confidence += 0.20;
    if (input.sector)
        confidence += 0.10;
    if (specific)
        confidence += 0.20;
    if (input.evidence.length >= 2)
        confidence += 0.10;
    if (input.revenue != null || input.profitable != null)
        confidence += 0.08;
    confidence = Math.min(0.98, confidence);
    if (!specific)
        confidence = Math.min(0.55, confidence);
    return {
        assetClass: assetClassOf(input, model), sector: input.sector ?? null, industry: input.industry ?? null,
        businessModel: model, lifecycle, capitalIntensity: capitalIntensityOf(model), cyclicality: cyclicalityOf(model),
        profitabilityStage: profitabilityOf(input, lifecycle), confidence: +confidence.toFixed(2),
        evidenceIds: [...new Set(input.evidence.map(e => e.id))]
    };
}
