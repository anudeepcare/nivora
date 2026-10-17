"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourceRank = void 0;
exports.evidenceCoverage = evidenceCoverage;
const sourceRank = (s) => s === "SEC" ? 4 : s === "ISSUER" ? 3 : s === "PROVIDER" ? 2 : 1;
exports.sourceRank = sourceRank;
function evidenceCoverage(required, set) { if (!required.length)
    return 0; return Math.round(required.filter(k => (set[k] || []).some(x => x.value != null)).length / required.length * 100); }
