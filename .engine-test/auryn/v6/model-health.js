"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arenaRowsToProofObservations = arenaRowsToProofObservations;
exports.buildModelHealth = buildModelHealth;
const proof_1 = require("./proof");
const allowed = new Set(['STRONG_BUY', 'BUY', 'HOLD', 'REDUCE', 'SELL', 'INSUFFICIENT_EVIDENCE']);
const regime = (x) => { const n = Number(x); if (!Number.isFinite(n))
    return 'UNKNOWN'; return n >= 4 ? 'RISK_ON' : n <= -4 ? 'RISK_OFF' : 'NEUTRAL'; };
const actionOf = (d) => { const a = String(d?.primaryAction ?? d?.action ?? d?.v5?.decision?.primaryAction ?? 'INSUFFICIENT_EVIDENCE'); return allowed.has(a) ? a : 'INSUFFICIENT_EVIDENCE'; };
function arenaRowsToProofObservations(snaps, outs) {
    const map = new Map((snaps || []).map((s) => [Number(s.id), s]));
    const result = [];
    for (const o of outs || []) {
        const s = map.get(Number(o.snapshot_id));
        if (!s)
            continue;
        const d = s.decision || {}, action = actionOf(d), alphaPct = Number(o.alpha_pct);
        if (action === 'INSUFFICIENT_EVIDENCE' || !Number.isFinite(alphaPct))
            continue;
        result.push({ action, alphaPct, horizon: String(o.horizon || 'UNKNOWN'), archetype: String(d?.classification?.businessModel ?? d?.archetype ?? d?.v5?.v4?.classification?.businessModel ?? 'unknown'), regime: regime(o.benchmark_return_pct), maxDrawdownPct: Number.isFinite(Number(o.max_drawdown_pct)) ? Number(o.max_drawdown_pct) : null, confidenceScore: Number.isFinite(Number(d?.evidenceConfidence?.score ?? d?.confidenceScore)) ? Number(d?.evidenceConfidence?.score ?? d?.confidenceScore) : null });
    }
    return result;
}
function buildModelHealth(snaps, outs) {
    const rows = arenaRowsToProofObservations(snaps, outs), proof = (0, proof_1.summarizeModelProof)(rows);
    const horizons = {};
    for (const h of new Set(rows.map(r => r.horizon))) {
        const xs = rows.filter(r => r.horizon === h), avg = xs.reduce((s, r) => s + r.alphaPct, 0) / xs.length, hit = xs.filter(r => r.alphaPct > 0).length / xs.length * 100;
        horizons[h] = { n: xs.length, avgAlphaPct: +avg.toFixed(2), hitRatePct: +hit.toFixed(1) };
    }
    const regimeCounts = { RISK_ON: 0, NEUTRAL: 0, RISK_OFF: 0, UNKNOWN: 0 };
    for (const r of rows)
        regimeCounts[r.regime]++;
    return { proof, horizons, regimeCounts, weaknesses: proof.promotion.blockers };
}
