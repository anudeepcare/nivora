import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeResearchHistory } from '../src/server/research-history.js';
import { validateProviderPayload } from '../src/server/provider-schemas.js';
import fs from'node:fs/promises';

test('EODHD numeric-string history remains eligible for research calculations', () => {
  const payload = [
    { date: '2026-10-30', adjusted_close: '101.25', close: '99.00' },
    { date: '2026-10-31', close: '102.50' },
  ];

  assert.equal(validateProviderPayload('eodhd.history', payload).status, 'valid');
  assert.deepEqual(normalizeResearchHistory(payload), [
    { date: '2026-10-30', close: 101.25, volume: null },
    { date: '2026-10-31', close: 102.5, volume: null },
  ]);
});

test('research history preserves validated optional volume for Technicals and Indicators',()=>{
  assert.deepEqual(normalizeResearchHistory([{date:'2026-10-30',close:'10',volume:'1234'},{date:'2026-10-31',close:'11',volume:null}]),[{date:'2026-10-30',close:10,volume:1234},{date:'2026-10-31',close:11,volume:null}]);
});

test('research history sorts dated rows and rejects duplicate, impossible, and future observations',()=>{
  const options={asOf:new Date('2026-11-17T12:00:00Z')};
  assert.deepEqual(normalizeResearchHistory([{date:'2026-11-17',close:11},{date:'2026-11-15',close:10}],options).map(row=>row.date),['2026-11-15','2026-11-17']);
  assert.equal(normalizeResearchHistory([{date:'2026-11-15',close:10},{date:'2026-11-15',close:11}],options),null);
  assert.equal(normalizeResearchHistory([{date:'2026-02-30',close:10}],options),null);
  assert.equal(normalizeResearchHistory([{date:'2026-11-18',close:10}],options),null);
  assert.equal(normalizeResearchHistory([{date:'2026-11-17T00:00:00Z',close:10}],options),null);
});

test('research history rejects blank, nonpositive, and nonfinite close values', () => {
  for (const close of ['', '0', '-1', 'NaN', 'Infinity', null]) {
    const payload = [{ date: '2026-10-30', close }];
    assert.equal(validateProviderPayload('eodhd.history', payload).status, 'invalid');
    assert.equal(normalizeResearchHistory(payload), null);
  }
});

test('research route requests enough calendar history for the advertised three-year view',async()=>{const source=await fs.readFile(new URL('../src/server/app.js',import.meta.url),'utf8');assert.match(source,/Date\.now\(\)-1200\*864e5/);assert.doesNotMatch(source,/Date\.now\(\)-800\*864e5/)});
test('adjusted-history mode rejects rows whose adjustment basis is unknown',()=>{const options={asOf:new Date('2026-11-17T12:00:00Z'),requireAdjusted:true};assert.equal(normalizeResearchHistory([{date:'2026-11-16',close:100}],options),null);assert.deepEqual(normalizeResearchHistory([{date:'2026-11-16',close:90,adjusted_close:100}],options),[{date:'2026-11-16',close:100,volume:null}])});
