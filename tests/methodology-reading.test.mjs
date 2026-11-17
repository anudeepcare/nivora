import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { documents } from '../lib/legal-content.ts';
test('methodology omits internal launch planning and obsolete changelog', () => {
 const titles=documents.methodology.sections.map(s=>s.title);
 assert.ok(!titles.includes('Research and commercial review'));
 assert.ok(!titles.includes('Methodology changelog'));
});
test('methodology retains precise policy limits and validation caveats', () => {
 const text=documents.methodology.sections.map(s=>s.text).join(' ');
 for(const phrase of ['10%/25%/35%', '24 months', '18 months', 'not validated', 'No historical scores', 'not investing performance']) assert.ok(text.includes(phrase), phrase);
});
test('methodology detail is expandable without changing other legal documents', () => {
 const source=fs.readFileSync('components/LegalDocument.tsx','utf8');
 assert.match(source, /methodologyDetails/);
 assert.match(source, /<summary>\{s.title\}<\/summary>/);
});
