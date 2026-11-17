import test from 'node:test';import assert from 'node:assert/strict';import {cleanThesisRule,evaluateThesisRule,thesisConditionIdentity} from '../lib/thesis-rules.ts';
const rule={monitorEnabled:'true',monitorMetric:'margin',monitorThreshold:'10'},e={end:'2026-06-30',basis:'annual',currency:'USD',margin:9};
test('thesis condition catches first measured breach and equality is not below',()=>{assert.equal(evaluateThesisRule(rule,e,'2026-11-07').status,'review');assert.equal(evaluateThesisRule(rule,{...e,margin:10},'2026-11-07').status,'within-rule')});
test('missing, future and aged evidence cannot pass a thesis check',()=>{for(const x of [null,{...e,margin:null},{...e,end:'2027-01-01'},{...e,end:'2020-01-01'}])assert.equal(evaluateThesisRule(rule,x,'2026-11-07').status,'unknown')});
test('only explicit supported finite conditions can be enabled',()=>{assert.throws(()=>cleanThesisRule({...rule,monitorMetric:'stock-go-up'}));assert.throws(()=>cleanThesisRule({...rule,monitorThreshold:''}));assert.equal(evaluateThesisRule({...rule,monitorEnabled:'false'},e,'2026-11-07').status,'disabled')});
test('stock compensation check uses above direction',()=>assert.equal(evaluateThesisRule({...rule,monitorMetric:'sbcRevenue'},{...e,sbcRevenue:11},'2026-11-07').status,'review'));

test('prose saves and numerical formatting do not change condition identity',()=>assert.equal(thesisConditionIdentity({...rule,updated_at:'2026-11-01',thesis:'old'}),thesisConditionIdentity({...rule,monitorThreshold:'10.0',updated_at:'2026-11-07',thesis:'new'})));
