"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stableStringify = stableStringify;
exports.deterministicFingerprint = deterministicFingerprint;
function canonicalize(value) {
    if (Array.isArray(value))
        return value.map(canonicalize);
    if (value && typeof value === 'object') {
        const row = value;
        const out = {};
        for (const key of Object.keys(row).sort())
            out[key] = canonicalize(row[key]);
        return out;
    }
    if (typeof value === 'number' && !Number.isFinite(value))
        return null;
    return value;
}
function stableStringify(value) { return JSON.stringify(canonicalize(value)); }
function deterministicFingerprint(value) {
    const text = stableStringify(value);
    let h = BigInt("14695981039346656037");
    const prime = BigInt("1099511628211");
    const mask = BigInt("0xffffffffffffffff");
    for (let i = 0; i < text.length; i++) {
        h ^= BigInt(text.charCodeAt(i));
        h = (h * prime) & mask;
    }
    return h.toString(16).padStart(16, '0');
}
