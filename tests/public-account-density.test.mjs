import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (file) => fs.readFileSync(`components/${file}`, 'utf8');
test('public introduction uses content-sized spacing rather than a forced screen', () => {
 const css = read('PublicLanding.module.css');
 assert.doesNotMatch(css, /min-height: (620|570)px/);
});
test('mobile account access is ordered before the marketing story', () => {
 const css = read('Session.module.css');
 assert.match(css, /\.main\s*\{\s*order:\s*-1/);
});
test('settings links to its notification section instead of duplicating the alert shortcut', () => {
 const source = read('SupportingViews.tsx').split('export function Compare')[0];
 assert.match(source, /href="#settings-notifications"/);
 assert.equal((source.match(/<span>Price alerts<\/span>/g)||[]).length, 0);
});
test('research panel explanations have one visible accessible owner', () => {
 const source = read('SettingsExperience.tsx');
 assert.doesNotMatch(source, /title=\{detail\}/);
 assert.match(source, /<small>\{detail\}<\/small>/);
});
