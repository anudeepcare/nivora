"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coalesceRequest = coalesceRequest;
exports.recordProviderResult = recordProviderResult;
exports.providerHealthSnapshot = providerHealthSnapshot;
exports.resetProviderResilienceForTests = resetProviderResilienceForTests;
const inflight = new Map();
const health = new Map();
const empty = () => ({ successes: 0, failures: 0, consecutiveFailures: 0, lastSuccessAt: null, lastFailureAt: null, lastLatencyMs: null, totalLatencyMs: 0, requests: 0, coalescedJoins: 0 });
function h(provider) { const current = health.get(provider) || empty(); health.set(provider, current); return current; }
async function coalesceRequest(key, fn, provider) {
    if (provider)
        h(provider).requests++;
    const existing = inflight.get(key);
    if (existing) {
        if (provider)
            h(provider).coalescedJoins++;
        return existing;
    }
    const p = fn().finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
}
function recordProviderResult(provider, ok, latencyMs) { const x = h(provider), now = new Date().toISOString(); if (ok) {
    x.successes++;
    x.consecutiveFailures = 0;
    x.lastSuccessAt = now;
}
else {
    x.failures++;
    x.consecutiveFailures++;
    x.lastFailureAt = now;
} x.lastLatencyMs = latencyMs; x.totalLatencyMs += Math.max(0, latencyMs); }
function providerHealthSnapshot(provider) { const x = health.get(provider) || empty(), completed = x.successes + x.failures; return { provider, ...x, averageLatencyMs: completed ? Math.round(x.totalLatencyMs / completed) : null, errorRatePct: completed ? Math.round(x.failures / completed * 1000) / 10 : 0, status: x.consecutiveFailures >= 3 ? "DEGRADED" : x.successes === 0 && x.failures === 0 ? "UNKNOWN" : "OPERATIONAL" }; }
function resetProviderResilienceForTests() { inflight.clear(); health.clear(); }
