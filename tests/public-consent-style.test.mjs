import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('global consent owns its styles without loading the private workspace stylesheet',()=>{
const source=readFileSync('components/AnalyticsConsent.tsx','utf8');
assert.match(source,/import s from "\.\/AnalyticsConsent.module.css"/);
const css=readFileSync('components/AnalyticsConsent.module.css','utf8');
assert.match(css,/position: fixed/);assert.match(css,/safe-area-inset-bottom/);assert.match(css,/min-height: 44px/);
});
