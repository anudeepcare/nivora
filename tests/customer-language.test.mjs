import test from 'node:test';
import assert from 'node:assert/strict';
import { customerText } from '../lib/customer-language.ts';

test('customer copy hides vendor names, domains and endpoint queries without hiding freshness or failures', () => {
  for (const value of ['EODHD · Live 12:55', 'Twelve Data quota exceeded', 'TwelveData fallback · 2026-10-26', 'https://eodhd.com/api/real-time/IREN?api_token=private', 'https://api.twelvedata.com/quote?apikey=private']) {
    const result = customerText(value);
    assert.doesNotMatch(result, /eodhd|twelve\s*data|private|api_token|apikey/i);
  }
  assert.match(customerText('EODHD · Live 12:55'), /Live 12:55/);
  assert.match(customerText('Twelve Data quota exceeded'), /quota exceeded/);
  assert.equal(customerText('Reuters · 2026-10-26'), 'Reuters · 2026-10-26');
});
