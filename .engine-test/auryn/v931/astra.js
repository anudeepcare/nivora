"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAstraRequest = buildAstraRequest;
exports.validateAstraAnalysis = validateAstraAnalysis;
const explanation_1 = require("./explanation");
function buildAstraRequest(input) {
    return { model: 'gpt-6-astra', store: false, reasoning: { effort: 'high' }, instructions: 'You are AURYN Analyst, a senior investment-research challenger. Use only the supplied canonical evidence. Never invent or alter prices, levels, metrics, actions, sizing, confidence, or execution permissions. Be specific, quantify only values present in evidence, explain counter-evidence, and cite evidence IDs. The deterministic AURYN call is authoritative; disagreement must be framed as a challenger observation, never as an override.', input: JSON.stringify({ symbol: input.symbol, snapshotId: input.snapshotId, canonicalAction: input.canonicalAction, evidence: input.evidence }), text: { verbosity: 'low', format: { type: 'json_schema', name: 'auryn_astra_analysis', strict: true, schema: { type: 'object', additionalProperties: false, properties: { verdictAgreement: { type: 'string', enum: ['AGREE', 'PARTIAL', 'DISAGREE'] }, executiveSummary: { type: 'string' }, strongestEvidence: { type: 'array', items: { type: 'string' } }, strongestCounterEvidence: { type: 'array', items: { type: 'string' } }, decisionChangeExplanation: { type: 'array', items: { type: 'string' } }, thesisRisks: { type: 'array', items: { type: 'string' } }, catalysts: { type: 'array', items: { type: 'string' } }, investorActionExplanation: { type: 'string' }, ownerActionExplanation: { type: 'string' }, dataCaveats: { type: 'array', items: { type: 'string' } }, contradictionFlags: { type: 'array', items: { type: 'string' } }, evidenceIds: { type: 'array', items: { type: 'string' } } }, required: ['verdictAgreement', 'executiveSummary', 'strongestEvidence', 'strongestCounterEvidence', 'decisionChangeExplanation', 'thesisRisks', 'catalysts', 'investorActionExplanation', 'ownerActionExplanation', 'dataCaveats', 'contradictionFlags', 'evidenceIds'] } } } };
}
function allText(a) { return [a.executiveSummary, ...a.strongestEvidence, ...a.strongestCounterEvidence, ...a.decisionChangeExplanation, ...a.thesisRisks, ...a.catalysts, a.investorActionExplanation, a.ownerActionExplanation, ...a.dataCaveats, ...a.contradictionFlags].join(' '); }
function validateAstraAnalysis(a, evidence, canonicalAction) { const issues = []; if (a.proposedAction)
    issues.push('Astra attempted to propose an authoritative action.'); const ids = new Set(evidence.map(e => e.id)); for (const id of a.evidenceIds || [])
    if (!ids.has(id))
        issues.push(`Unknown evidence ID ${id}.`); if (!(a.evidenceIds || []).length)
    issues.push('Astra returned no evidence IDs.'); const allowed = (a.evidenceIds || []).flatMap(id => evidence.find(e => e.id === id)?.values || []); const nums = [...allText(a).matchAll(/(?<![A-Za-z])\$?(-?\d+(?:\.\d+)?)(?:%|x)?/g)].map(m => Number(m[1])).filter(Number.isFinite); for (const n of nums) {
    if (n >= 1900 && n <= 2100)
        continue;
    if (!allowed.some(v => Math.abs(v - n) <= Math.max(.01, Math.abs(v) * .001)))
        issues.push(`Unsupported number ${n}.`);
} const upper = allText(a).toUpperCase(); const actionWords = ['STRONG BUY', 'BUY', 'SELL', 'REDUCE']; for (const word of actionWords) {
    if (word !== canonicalAction.replaceAll('_', ' ').toUpperCase() && new RegExp(`\\b${word}\\b`).test(upper) && /SHOULD|RECOMMEND|ACTION|NEW MONEY/i.test(upper))
        issues.push(`Astra language may override canonical action with ${word}.`);
} const exp = (0, explanation_1.validateExpertExplanation)({ summary: a.executiveSummary, whatChanged: a.decisionChangeExplanation.join(' ') || 'No material change is claimed.', whyItMatters: a.strongestEvidence.join(' '), actionImpact: a.investorActionExplanation, nextTrigger: a.catalysts.join(' ') || 'No dated catalyst is required for the current call.', horizon: evidence[0]?.horizon || '6-12M', counterEvidence: a.strongestCounterEvidence.join(' '), evidenceIds: a.evidenceIds || [] }, evidence); issues.push(...exp.issues.filter(x => !x.startsWith('Missing nextTrigger'))); return { ok: issues.length === 0, issues }; }
