"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveTransformedSignal = deriveTransformedSignal;
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const std = (xs) => { if (xs.length < 2)
    return 0; const m = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); };
const round = (x, d = 6) => +x.toFixed(d);
function zscore(xs) { if (xs.length < 5)
    return null; const s = std(xs), m = mean(xs), last = xs.at(-1); return s > 1e-12 ? (last - m) / s : 0; }
function deriveTransformedSignal(transform, series) {
    const rows = series.filter(x => finite(x.value) && finite(x.price) && x.price > 0);
    if (!rows.length)
        return null;
    const vals = rows.map(x => x.value), last = vals.at(-1);
    let out = null;
    switch (transform) {
        case 'LEVEL':
            out = last;
            break;
        case 'SLOPE':
            out = vals.length >= 2 ? last - vals.at(-2) : null;
            break;
        case 'ACCELERATION':
            out = vals.length >= 3 ? (last - vals.at(-2)) - (vals.at(-2) - vals.at(-3)) : null;
            break;
        case 'PERCENTILE': {
            if (vals.length < 5) {
                out = null;
                break;
            }
            const window = vals.slice(-252), less = window.filter(x => x < last).length, equal = window.filter(x => x === last).length;
            out = ((less + .5 * equal) / window.length - .5) * 2;
            break;
        }
        case 'DIVERGENCE': {
            if (rows.length < 5) {
                out = null;
                break;
            }
            const w = rows.slice(-20), first = w[0], metricDelta = last - first.value, priceMove = (rows.at(-1).price / first.price - 1) * 100;
            const metricScale = std(w.map(x => x.value)) || 1;
            out = metricDelta / metricScale - priceMove / 10;
            break;
        }
        case 'CROSSOVER': {
            if (vals.length < 8) {
                out = null;
                break;
            }
            const short = mean(vals.slice(-3)), long = mean(vals.slice(-8)), scale = std(vals.slice(-8)) || 1;
            out = (short - long) / scale;
            break;
        }
        case 'ZSCORE':
            out = zscore(vals.slice(-60));
            break;
        case 'REGIME_NORMALIZED': {
            const regime = rows.at(-1).regime, same = rows.filter(x => x.regime === regime).slice(-120).map(x => x.value);
            out = zscore(same);
            break;
        }
    }
    return finite(out) ? round(out) : null;
}
