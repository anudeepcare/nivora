"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAutonomousCanonicalResearch = runAutonomousCanonicalResearch;
const nivora_investor_1 = require("../../nivora-investor");
const current_evidence_adapter_1 = require("../v4/current-evidence-adapter");
const analyze_1 = require("../v4/analyze");
const analyze_2 = require("../v5/analyze");
const research_events_1 = require("../v931/research-events");
const canonical_assessment_1 = require("../v931/canonical-assessment");
const research_contract_1 = require("./research-contract");
const finite = (x) => x !== null && x !== undefined && Number.isFinite(Number(x));
async function get(fetcher, origin, path) {
    const r = await fetcher(`${origin}${path}`, { cache: "no-store", headers: { "x-auryn-background-research": "1" } });
    let j = null;
    try {
        j = await r.json();
    }
    catch { }
    if (!r.ok || j?.error) {
        const e = new Error(j?.error || `HTTP_${r.status}`);
        e.status = r.status;
        e.code = j?.code;
        throw e;
    }
    return j;
}
async function runAutonomousCanonicalResearch(symbolRaw, { origin, fetcher = fetch }) {
    const symbol = symbolRaw.toUpperCase();
    try {
        const [d, company, context, institutional] = await Promise.all([
            get(fetcher, origin, `/api/analyze/${encodeURIComponent(symbol)}`), get(fetcher, origin, `/api/company/${encodeURIComponent(symbol)}`),
            get(fetcher, origin, `/api/context/${encodeURIComponent(symbol)}`), get(fetcher, origin, `/api/institutional/${encodeURIComponent(symbol)}`)
        ]);
        const marketTruth = d?.marketTruth;
        if (!marketTruth?.snapshotId)
            return { state: "INSUFFICIENT_EVIDENCE", reason: "MARKET_TRUTH_MISSING" };
        const px = Number(marketTruth.decisionPrice), market = finite(px) ? { ...d, price: px, canonicalMarketSnapshot: marketTruth } : { ...d, canonicalMarketSnapshot: marketTruth };
        const legacy = (0, nivora_investor_1.buildInvestorDecision)({ market, company, context, institutional, owns: false, position: null });
        const v4 = (0, analyze_1.buildAurynV4CoreAnalysis)((0, current_evidence_adapter_1.adaptCurrentEvidenceToV4)({ symbol, asOf: marketTruth.asOf || new Date().toISOString(), market, company, context, institutional, legacyDecision: legacy }));
        const v5 = (0, analyze_2.buildAurynV5Analysis)({ symbol, marketTruth, v4, technical: market?.technicalState && market?.indicators ? market : null, bars: Array.isArray(market?.candles) ? market.candles : [] });
        const { decision, snapshot, financial } = (0, canonical_assessment_1.buildCanonicalAssessment)({ symbol, marketTruth, v5, company, context, marketData: d });
        if (!(0, research_contract_1.validateResearchDecision)(decision))
            return { state: "INSUFFICIENT_EVIDENCE", reason: "CANONICAL_DECISION_INCOMPLETE" };
        return { state: "RESEARCH_READY", decision, snapshot, financial, events: (0, research_events_1.collectResearchEvents)(symbol, company, context, marketTruth.asOf), marketTruth, marketIntelligence: d?.marketIntelligence ?? null };
    }
    catch (e) {
        return { state: (0, research_contract_1.classifyResearchFailure)(e), reason: String(e?.code || e?.message || e) };
    }
}
