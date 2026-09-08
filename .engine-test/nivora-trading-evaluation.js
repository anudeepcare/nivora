"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainNoIntent = explainNoIntent;
function explainNoIntent(today, hasPosition) {
    if (!today)
        return { code: "MISSING_TODAY", reason: "Frozen decision has no Today action." };
    if ((today.action === "SELL" || today.action === "TRIM") && !hasPosition)
        return { code: "NO_POSITION", reason: "No paper position exists to exit." };
    return { code: "NO_INTENT", reason: `Today action ${today.action} does not authorize a paper trade intent.` };
}
