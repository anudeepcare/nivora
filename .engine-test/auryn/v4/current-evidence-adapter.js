"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptCurrentEvidenceToV4 = adaptCurrentEvidenceToV4;
const finite = (x) => x !== null && x !== undefined && x !== "" && typeof x !== "boolean" && Number.isFinite(Number(x));
const clamp = (n) => Math.max(0, Math.min(100, n));
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
function adaptCurrentEvidenceToV4(input) {
    const market = input.market ?? {}, company = input.company ?? {}, context = input.context ?? {}, legacy = input.legacyDecision ?? {};
    const raw = company?.rawMetrics ?? {};
    const observations = [];
    const refs = [];
    const refIds = new Set();
    const addRef = (id, key, scope = "POINT_IN_TIME", source = "DERIVED", validationState = "HEURISTIC") => {
        if (!refIds.has(id)) {
            refs.push({ id, key, scope, source, asOf: input.asOf, validationState });
            refIds.add(id);
        }
        return id;
    };
    const addObs = (factor, score, reason, id, state = "HEURISTIC", scope = "POINT_IN_TIME", source = "DERIVED") => {
        if (!finite(score))
            return;
        addRef(id, factor, scope, source, state);
        observations.push({ factor, score: clamp(Number(score)), reason, evidenceIds: [id], validationState: state });
    };
    const factors = legacy?.factors ?? {};
    const fundamentalCurrent = finite(company?.fundamentalSignal?.currentScore) ? Number(company.fundamentalSignal.currentScore) : null;
    const recordScore = finite(company?.fiveYearRecord?.score) ? Number(company.fiveYearRecord.score) : null;
    const businessCandidates = [finite(factors.business) ? Number(factors.business) : null, fundamentalCurrent, recordScore].filter((x) => x != null);
    const business = mean(businessCandidates);
    if (business != null)
        addObs("BUSINESS_QUALITY", business, "Current business-quality evidence from the canonical AURYN company record.", "legacy:company:business", businessCandidates.length >= 2 ? "HEURISTIC" : "COLLECTING", "TTM");
    if (finite(factors.growth))
        addObs("GROWTH_INFLECTION", factors.growth, "Canonical growth factor from current AURYN evidence.", "legacy:decision:growth", "HEURISTIC", "TTM");
    else if (finite(raw.revGrowth))
        addObs("GROWTH_INFLECTION", clamp(50 + Number(raw.revGrowth)), "Revenue growth translated into a migration-stage growth-inflection score.", "legacy:company:revGrowth", "HEURISTIC", "TTM");
    const fundamentalParts = [];
    if (finite(factors.financial))
        fundamentalParts.push(Number(factors.financial));
    if (finite(factors.earnings))
        fundamentalParts.push(Number(factors.earnings));
    if (!fundamentalParts.length) {
        if (finite(raw.opMargin))
            fundamentalParts.push(clamp(50 + Number(raw.opMargin)));
        if (finite(raw.fcf))
            fundamentalParts.push(Number(raw.fcf) > 0 ? 70 : 30);
        if (finite(raw.leverage))
            fundamentalParts.push(clamp(100 - Number(raw.leverage)));
        const surprise = context?.surprises?.[0]?.surprisePercent;
        if (finite(surprise))
            fundamentalParts.push(clamp(50 + Number(surprise) * .8));
    }
    const fundamentals = mean(fundamentalParts);
    if (fundamentals != null)
        addObs("FUNDAMENTALS_EARNINGS", fundamentals, "Margins, cash generation, leverage and earnings execution available in the current evidence set.", "legacy:company:fundamentals", "HEURISTIC", "TTM");
    const valuationProofStatus = String(legacy?.metricProofs?.valuation?.status ?? "").toUpperCase();
    const valuationValidityStatus = String(legacy?.valuationValidity?.status ?? "").toUpperCase();
    const valuationExplicitlyUnavailable = legacy?.factorAvailability?.valuation === false || valuationProofStatus === "UNAVAILABLE" || valuationValidityStatus === "UNSUPPORTED" || valuationValidityStatus === "STALE";
    if (!valuationExplicitlyUnavailable && finite(factors.valuation)) {
        const valuationReason = String(legacy?.valuationBasis || "Current AURYN relative-valuation evidence.");
        const qualifier = valuationValidityStatus && valuationValidityStatus !== "VALID" ? ` ${String(legacy?.valuationValidity?.reason || "")}` : "";
        addObs("VALUATION", factors.valuation, `${valuationReason}${qualifier}`.trim(), "legacy:decision:valuation", valuationValidityStatus === "VALID" ? "MEASURED" : "HEURISTIC", "POINT_IN_TIME");
    }
    else if (!valuationExplicitlyUnavailable) {
        const map = { "Deeply attractive": 85, "Attractive": 72, "Fair": 55, "Expensive": 30 };
        const v = map[String(legacy?.valuationLabel ?? "")];
        if (finite(v))
            addObs("VALUATION", v, "Legacy valuation label mapped conservatively for V4 migration.", "legacy:decision:valuationLabel", "HEURISTIC", "POINT_IN_TIME");
    }
    const timing = finite(legacy?.timing?.score) ? legacy.timing.score : finite(factors.timing) ? factors.timing : null;
    if (finite(timing))
        addObs("TECHNICALS", timing, "Current AURYN timing/technical composite.", "legacy:market:timing", "MEASURED", "POINT_IN_TIME", "DERIVED");
    const hasCatalystEvidence = Boolean(context?.guidance || company?.guidance || (Array.isArray(context?.news) && context.news.length) || (Array.isArray(context?.surprises) && context.surprises.length));
    if (hasCatalystEvidence && finite(factors.catalysts))
        addObs("CATALYSTS", factors.catalysts, "Current source-backed earnings/news catalyst state.", "legacy:context:catalysts", "HEURISTIC", "FORWARD");
    const sectorScore = context?.sectorScore ?? market?.sector?.score ?? market?.sectorScore;
    if (finite(sectorScore))
        addObs("SECTOR_INDUSTRY", sectorScore, "Explicit sector/industry relative-state score.", "legacy:market:sector", "MEASURED", "POINT_IN_TIME");
    const macroScore = legacy?.strategicContext?.macroScore ?? market?.market?.score ?? market?.macroScore;
    if (finite(macroScore))
        addObs("MACRO_REGIME", macroScore, "Measured market/macro regime context.", "legacy:market:macro", "MEASURED", "POINT_IN_TIME");
    const risk = finite(factors.risk) ? factors.risk : finite(market?.scores?.risk) ? market.scores.risk : null;
    if (finite(risk))
        addObs("RISK", risk, "Current AURYN downside/risk-pressure score; higher means more risk.", "legacy:market:risk", "MEASURED", "POINT_IN_TIME");
    // Migration-only moat proxy: never infer it from price. It requires at least two
    // existing slow/forward durability evidence items and remains explicitly HEURISTIC.
    const inferredMoatSignals = [];
    const strategicEvidence = Array.isArray(legacy?.strategicContext?.evidence) ? legacy.strategicContext.evidence.filter(Boolean) : [];
    const hasExplicitMoat = (input.explicitV4?.observations ?? []).some(o => o.factor === "MOAT") || (input.explicitV4?.moatSignals ?? []).length > 0;
    if (!hasExplicitMoat && strategicEvidence.length >= 2) {
        const moatParts = [
            finite(legacy?.strategicContext?.runwayScore) ? Number(legacy.strategicContext.runwayScore) : null,
            finite(legacy?.strategicContext?.executionScore) ? Number(legacy.strategicContext.executionScore) : null,
            finite(company?.fiveYearRecord?.score) ? Number(company.fiveYearRecord.score) : null,
            finite(raw?.grossMargin) ? clamp(Math.abs(Number(raw.grossMargin)) <= 1 ? Number(raw.grossMargin) * 100 : Number(raw.grossMargin)) : null
        ].filter((x) => x != null);
        const moatScore = mean(moatParts);
        if (moatScore != null) {
            const evidenceIds = strategicEvidence.slice(0, 4).map((_, i) => addRef(`legacy:strategic:moat:${i}`, "MOAT", "FORWARD", "DERIVED", "HEURISTIC"));
            if (company?.fiveYearRecord?.score != null)
                evidenceIds.push(addRef("legacy:company:moat:record", "MOAT", "TTM", "DERIVED", "HEURISTIC"));
            const moatObs = { factor: "MOAT", score: clamp(moatScore), reason: "Evidence-backed competitive-durability proxy during V4 migration; this is heuristic, not a measured moat.", evidenceIds: [...new Set(evidenceIds)], validationState: "HEURISTIC" };
            observations.push(moatObs);
            inferredMoatSignals.push(moatObs);
        }
    }
    // Only explicit, source-backed V4 evidence may populate narrative or positioning.
    for (const r of input.explicitV4?.evidenceRefs ?? []) {
        if (!refIds.has(r.id)) {
            refs.push(r);
            refIds.add(r.id);
        }
    }
    for (const o of input.explicitV4?.observations ?? []) {
        if (o.factor !== "MOAT" && o.factor !== "POSITIONING" && o.factor !== "NARRATIVE_EXPECTATIONS")
            observations.push(o);
        else if (o.evidenceIds.length)
            observations.push(o);
    }
    const profile = context?.profile ?? {};
    const industry = profile?.finnhubIndustry ?? profile?.industry ?? company?.industry ?? null;
    const sector = profile?.sector ?? company?.sector ?? context?.sector ?? null;
    const sourceBackedContextText = [
        context?.summary?.description,
        context?.summary?.topReason,
        ...(Array.isArray(context?.news) ? context.news.slice(0, 6).flatMap((x) => [x?.headline ?? x?.title, x?.summary]) : [])
    ].filter((x) => typeof x === "string" && x.trim()).join(" ").slice(0, 2400);
    const description = profile?.description ?? company?.description ?? context?.summary?.description ?? (sourceBackedContextText || null);
    const latestHistoryRevenue = Array.isArray(company?.fiveYearRecord?.history) ? [...company.fiveYearRecord.history].reverse().find((x) => finite(x?.revenue))?.revenue : null;
    const revenue = finite(raw?.revenue) ? Number(raw.revenue) : finite(company?.revenue) ? Number(company.revenue) : finite(latestHistoryRevenue) ? Number(latestHistoryRevenue) : null;
    const revenueGrowth = finite(raw?.revGrowth) ? Number(raw.revGrowth) : finite(company?.revenueGrowth) ? Number(company.revenueGrowth) : null;
    const operatingMargin = finite(raw?.opMargin) ? Number(raw.opMargin) : null;
    const fcf = finite(raw?.fcf) ? Number(raw.fcf) : null;
    const profitable = typeof company?.profitable === "boolean" ? company.profitable : operatingMargin != null ? operatingMargin > 0 : fcf != null ? fcf > 0 : null;
    const classificationInput = { assetType: market?.assetType ?? company?.assetType ?? "stock", sector, industry, name: profile?.name ?? company?.name ?? input.symbol, description, revenue, revenueGrowth, operatingMargin, fcf, profitable, archetypeHint: legacy?.archetype ?? null, strategicTheme: legacy?.strategicContext?.theme ?? null };
    const slowEvidenceFingerprint = JSON.stringify({
        currentScore: company?.fundamentalSignal?.currentScore ?? null,
        recordScore: company?.fiveYearRecord?.score ?? null,
        revGrowth: raw?.revGrowth ?? null,
        opMargin: raw?.opMargin ?? null,
        fcf: raw?.fcf ?? null,
        leverage: raw?.leverage ?? null,
        latestQuarter: company?.latestQuarter ?? null,
        guidance: context?.guidance ?? company?.guidance ?? null
    });
    const explicit = input.explicitV4 ?? {};
    const hardVetoes = [...(explicit.hardVetoes ?? [])];
    if (company?.filingRisk && String(company?.filingRisk).toLowerCase().includes("going concern"))
        hardVetoes.push("SOLVENCY_OR_FINANCING_FAILURE");
    const softConstraints = [...(explicit.softConstraints ?? [])];
    const valuationLabel = String(legacy?.valuationLabel ?? "");
    if (valuationLabel === "Expensive" && finite(timing) && Number(timing) < 45)
        softConstraints.push("EXTREME_VALUATION");
    if (finite(timing) && Number(timing) < 35)
        softConstraints.push("TECHNICAL_INSTABILITY");
    return {
        symbol: String(input.symbol || "").toUpperCase(), asOf: input.asOf, classificationInput,
        evidenceRefs: refs, evidenceConflicts: [...(explicit.evidenceConflicts ?? [])], observations,
        moatSignals: [...inferredMoatSignals, ...(explicit.moatSignals ?? [])], moatReasons: explicit.moatReasons ?? { drivers: [], threats: [] }, slowEvidenceFingerprint,
        priorThesis: input.priorThesis, priorMoat: input.priorMoat,
        narrative: explicit.narrative ?? { market: [], auryn: [], expectationGapScore: finite(legacy?.expectationGap?.score) ? Number(legacy.expectationGap.score) : null },
        thesisReasons: explicit.thesisReasons ?? { positive: (legacy?.drivers ?? []).slice(0, 5).map((text, i) => ({ id: `legacy:driver:${i}`, text, evidenceIds: [addRef(`legacy:driver:${i}`, "driver", "FORWARD", "DERIVED", "HEURISTIC")] })), negative: (legacy?.risks ?? []).slice(0, 5).map((text, i) => ({ id: `legacy:risk:${i}`, text, evidenceIds: [addRef(`legacy:risk:${i}`, "risk", "FORWARD", "DERIVED", "HEURISTIC")] })), marketMayBeMissing: [] },
        thesisInvalidators: explicit.thesisInvalidators ?? [...(legacy?.breakers ?? [])],
        hardVetoes: [...new Set(hardVetoes)], softConstraints: [...new Set(softConstraints)]
    };
}
