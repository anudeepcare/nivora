import test from 'node:test';import assert from 'node:assert/strict';import {homeComposition} from '../lib/home-presentation.ts';
test('first visit has research purpose without invented holdings',()=>assert.equal(homeComposition(0,0),'first-use'));
test('watchlist-only home does not imply portfolio exposure',()=>assert.equal(homeComposition(0,3),'watchlist'));
test('holdings home retains financial context',()=>assert.equal(homeComposition(2,0),'holdings'));
