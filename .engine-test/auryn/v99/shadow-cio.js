"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTCOME_HORIZONS = void 0;
exports.fingerprintShadowSnapshot = fingerprintShadowSnapshot;
exports.outcomeDueAt = outcomeDueAt;
const node_crypto_1 = require("node:crypto");
const stable = (v) => { if (v === null || typeof v !== "object")
    return JSON.stringify(v); if (Array.isArray(v))
    return `[${v.map(stable).join(",")}]`; return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`; };
function fingerprintShadowSnapshot(x) { return (0, node_crypto_1.createHash)("sha256").update(stable({ ...x, symbol: x.symbol.toUpperCase() })).digest("hex"); }
function add(date, n, unit) { const d = new Date(`${date}T12:00:00Z`); if (unit === "d")
    d.setUTCDate(d.getUTCDate() + n); if (unit === "m")
    d.setUTCMonth(d.getUTCMonth() + n); if (unit === "y")
    d.setUTCFullYear(d.getUTCFullYear() + n); return d.toISOString().slice(0, 10); }
function outcomeDueAt(date, h) { return h === "1W" ? add(date, 7, "d") : h === "1M" ? add(date, 1, "m") : h === "3M" ? add(date, 3, "m") : h === "6M" ? add(date, 6, "m") : h === "1Y" ? add(date, 1, "y") : h === "3Y" ? add(date, 3, "y") : add(date, 5, "y"); }
exports.OUTCOME_HORIZONS = ["1W", "1M", "3M", "6M", "1Y", "3Y", "5Y"];
