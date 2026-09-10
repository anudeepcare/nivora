import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const domain=fs.readFileSync('lib/auryn/v931/domain.ts','utf8');
const tab=fs.readFileSync('components/stock/StockTabContext.tsx','utf8');

test('V9.3.1 institutional actions are narrow unions, not generic strings',()=>{
  assert.match(domain,/export type InstitutionalNewMoneyAction='BUY'\|'START_SMALL'\|'WAIT'/);
  assert.match(domain,/newMoneyAction:InstitutionalNewMoneyAction/);
});

test('StockTabContext accepts canonical V4 or institutional new-money actions',()=>{
  assert.match(tab,/InstitutionalNewMoneyAction/);
  assert.match(tab,/action\?:PrimaryInvestmentAction\|InstitutionalNewMoneyAction\|null/);
});
