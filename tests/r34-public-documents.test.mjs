import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as navigation from '../lib/settings-navigation.ts';
const read = name => readFileSync(new URL(`../components/${name}`, import.meta.url), 'utf8');
test('unverified workspace origins return to home; verified users keep the exact valid workspace path', () => {
 assert.equal(navigation.documentBackTarget?.('/overview', false)?.href,'/');
 assert.equal(navigation.documentBackTarget?.('/research/APP?tab=News#story', true)?.href,'/research/APP?tab=News#story');
 assert.equal(navigation.documentBackTarget?.('/pricing', false)?.label,'Back to pricing');
 assert.equal(navigation.documentBackTarget?.('//evil.invalid', false)?.href,'/');
 assert.match(read('ContextLink.tsx'),/auth\s*\.getUser\(\)/);
});
test('Help keeps a single prominent support action and retains searchable topics', () => {
 const source=read('LegalDocument.tsx');
 assert.equal([...source.matchAll(/page="contact"/g)].length,1);
 assert.match(source,/type="search"/);
 assert.match(source,/matching/);
 assert.match(source,/aria-label="Help and legal documents"/);
});
