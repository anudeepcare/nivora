import test from 'node:test';import assert from 'node:assert/strict';
import {handbookChapters,findHandbookChapters} from '../lib/handbook-reader.ts';
const text='# Handbook\nPrivate source snapshot\n\n## 1. Explain Pace\nA real explanation.\n\n## Reference: code\n```ts\n## Not a chapter\n```\n\n## 2. Options\nGamma explanation.';
test('opens substantive explanations and ignores headings inside code',()=>{const c=handbookChapters(text);assert.equal(c[0].title,'1. Explain Pace');assert.equal(c.length,3);assert.match(c[0].body,/real explanation/);});
test('implementation reference is opt-in and search finds chapter body',()=>{const c=handbookChapters(text);assert.equal(findHandbookChapters(c,'',false).length,2);assert.equal(findHandbookChapters(c,'gamma',false)[0].title,'2. Options');assert.equal(findHandbookChapters(c,'Not a chapter',true).length,1);});
