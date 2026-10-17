"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateRunCompletion = evaluateRunCompletion;
const complete = (x) => Boolean(x?.symbol && Number(x?.market_price) > 0 && x?.new_money_action && x?.owner_action && x?.long_term_action && Number.isFinite(Number(x?.decision_score)) && Number.isFinite(Number(x?.evidence_completeness)) && x?.setup_state && x?.evidence_fingerprint && x?.snapshot_fingerprint);
function evaluateRunCompletion({ expected, jobs, snapshots }) {
    const counts = { DONE: 0, PENDING: 0, RUNNING: 0, FAILED: 0 };
    for (const j of jobs)
        counts[String(j.status)] = (counts[String(j.status)] || 0) + 1;
    const open = counts.PENDING + counts.RUNNING;
    if (open)
        return { status: "RUNNING", counts, distinctSnapshots: new Set(snapshots.map(x => x.symbol)).size, completeSnapshots: snapshots.filter(complete).length };
    const distinct = new Set(snapshots.filter(complete).map(x => String(x.symbol).toUpperCase())).size;
    const status = counts.FAILED === 0 && jobs.length === expected && distinct === expected ? "PASS" : "FAIL";
    return { status, counts, distinctSnapshots: distinct, completeSnapshots: snapshots.filter(complete).length };
}
