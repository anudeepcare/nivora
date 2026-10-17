"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BACKGROUND_CALLS_PER_MINUTE = exports.PROVIDER_CALLS_PER_MINUTE = void 0;
exports.retryDelaySeconds = retryDelaySeconds;
exports.jobIdempotencyKey = jobIdempotencyKey;
exports.chunkSymbols = chunkSymbols;
exports.PROVIDER_CALLS_PER_MINUTE = 55;
exports.BACKGROUND_CALLS_PER_MINUTE = 42;
function retryDelaySeconds(attempt) { return Math.min(900, 30 * (2 ** Math.max(0, attempt))); }
function jobIdempotencyKey(kind, date, batch) { return `auryn-v99:${kind}:${date}:batch-${String(batch).padStart(3, "0")}`; }
function chunkSymbols(symbols, size = 10) { const out = []; for (let i = 0; i < symbols.length; i += size)
    out.push(symbols.slice(i, i + size)); return out; }
