"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreLabel = scoreLabel;
function scoreLabel(score) {
    const s = Math.max(0, Math.min(100, Number(score) || 0));
    if (s >= 90)
        return "Exceptional";
    if (s >= 80)
        return "Strong";
    if (s >= 70)
        return "Good";
    if (s >= 60)
        return "Constructive";
    if (s >= 45)
        return "Mixed";
    if (s >= 30)
        return "Weak";
    return "Poor";
}
