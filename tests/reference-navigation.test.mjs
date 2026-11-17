import test from 'node:test';
import assert from 'node:assert/strict';
import { desktopNavigation, mobileNavigation, researchLenses, lensForSection } from '../lib/reference-navigation.ts';
test('reference desktop and mobile navigation preserve actual routes', () => {
 assert.deepEqual(desktopNavigation.map(x=>x.label), ['Today','Research','Discover','Compare','Watchlist','Portfolio']);
 assert.deepEqual(mobileNavigation.map(x=>x.label), ['Today','Research','Watchlist','Portfolio']);
 assert.equal(desktopNavigation[0].path,'overview');
});
test('eight reference lenses preserve all existing evidence sections', () => {
 assert.deepEqual(researchLenses.map(x=>x.label), ['Atlas','Scenarios','Technicals','Ownership','Events','Indicators','Pace','Options']);
 for(const section of ['Snapshot','Thesis','Financials','Valuation','Technicals','Analysts','News','Advanced','Options','Pace']) assert.ok(lensForSection(section),section);
 assert.equal(lensForSection('Analysts').label,'Atlas');
 assert.equal(lensForSection('Pace').label,'Pace');
 assert.equal(lensForSection('unknown'),undefined);
});
