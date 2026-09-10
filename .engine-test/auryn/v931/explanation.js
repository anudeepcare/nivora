"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExpertExplanation = validateExpertExplanation;
const generic = [/strong fundamentals/i, /promising growth/i, /momentum (is )?improving/i, /risk remains elevated/i, /valuation (looks|is) attractive/i, /be cautious/i, /watch price/i];
const fields = (x) => [x.summary, x.whatChanged, x.whyItMatters, x.actionImpact, x.nextTrigger, x.counterEvidence];
function numbers(text) { return [...text.matchAll(/(?<![A-Za-z])\$?(-?\d+(?:\.\d+)?)(?:%|x)?/g)].map(m => Number(m[1])).filter(Number.isFinite); }
function validateExpertExplanation(x, evidence) { const issues = []; for (const k of ['summary', 'whatChanged', 'whyItMatters', 'actionImpact', 'nextTrigger', 'horizon', 'counterEvidence'])
    if (!String(x[k] || '').trim())
        issues.push(`Missing ${k}.`); if (!Array.isArray(x.evidenceIds) || !x.evidenceIds.length)
    issues.push('At least one evidence ID is required.'); const byId = new Map(evidence.map(e => [e.id, e])); for (const id of x.evidenceIds || [])
    if (!byId.has(id))
        issues.push(`Unknown evidence ID ${id}.`); const corpus = fields(x).join(' '); if (generic.some(r => r.test(corpus)) && corpus.length < 260)
    issues.push('Explanation is generic; quantified evidence and decision relevance are required.'); const allowed = (x.evidenceIds || []).flatMap(id => byId.get(id)?.values || []); for (const n of numbers(corpus)) {
    if (n >= 1900 && n <= 2100)
        continue;
    if (!allowed.some(a => Math.abs(a - n) <= Math.max(.01, Math.abs(a) * .001)))
        issues.push(`Unsupported number ${n}.`);
} if (!/(?:\b(?:DAY|DAYS|WEEK|WEEKS|MONTH|MONTHS|YEAR|YEARS|SWING|LONG|INTRADAY)\b|\b\d+(?:-\d+)?D\b)/i.test(x.horizon))
    issues.push('Horizon is not explicit.'); return { ok: issues.length === 0, issues }; }
