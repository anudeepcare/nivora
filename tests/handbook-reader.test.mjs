import test from 'node:test';import assert from 'node:assert/strict';
import {handbookChapters,findHandbookChapters} from '../lib/handbook-reader.ts';
const text='# Handbook\nPrivate source snapshot\n\n## 1. Explain Pace\nA real explanation.\n\n## Reference: code\n```ts\n## Not a chapter\n```\n\n## 2. Options\nGamma explanation.';
test('opens substantive explanations and ignores headings inside code',()=>{const c=handbookChapters(text);assert.equal(c[0].title,'1. Explain Pace');assert.equal(c.length,3);assert.match(c[0].body,/real explanation/);});
test('implementation reference is opt-in and search finds chapter body',()=>{const c=handbookChapters(text);assert.equal(findHandbookChapters(c,'',false).length,2);assert.equal(findHandbookChapters(c,'gamma',false)[0].title,'2. Options');assert.equal(findHandbookChapters(c,'Not a chapter',true).length,1);});
test('guide blocks preserve readable lists tables code and headings without executing markup',async()=>{
 const {handbookBlocks}=await import('../lib/handbook-reader.ts');
 const rows=handbookBlocks('### Read this\n\n- First\n- Second\n\n| Field | Value |\n| --- | --- |\n| Pace | P2 |\n\n```ts\nconst x = 1;\n```\n\n<script>alert(1)</script>');
 assert.deepEqual(rows.map(x=>x.kind),['heading','list','table','code','paragraph']);assert.equal(rows[1].items.length,2);assert.deepEqual(rows[2].rows,[['Pace','P2']]);assert.equal(rows[4].text,'<script>alert(1)</script>');
});
