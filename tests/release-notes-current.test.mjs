import test from 'node:test';
import assert from 'node:assert/strict';
import {releases, latestPublished, APP_VERSION} from '../lib/releases.ts';
import fs from 'node:fs';
test('Current concise notes remain a review candidate, not a live announcement',()=>{
 const r=releases[0];assert.equal(r.version,APP_VERSION);assert.equal(r.date,'2026-11-17');assert.equal(r.status,'candidate');assert.equal(latestPublished(),null);
 assert.ok(r.groups['Still being verified']);
 assert.ok(Object.values(r.groups).flat().length<=12);
 assert.match(r.groups['Settings & guardrails'].join(' '),/do not execute or block trades/);
 assert.match(r.groups['Still being verified'].join(' '),/not a deployment/);
});
test('Prior draft notes are retained without restoring obsolete styling claims to the current page',()=>{
 assert.ok(fs.existsSync('docs/release-draft-nov07-archive.ts.txt'));
 assert.doesNotMatch(JSON.stringify(releases),/citron|mint|All features work|fully verified/);
});
