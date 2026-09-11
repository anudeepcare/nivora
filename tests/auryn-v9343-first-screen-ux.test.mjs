import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url).pathname;
const read=p=>fs.readFileSync(root+p,'utf8');

test('first screen integrates setup meaning with the canonical call instead of hiding it in Technicals',()=>{
 const brief=read('components/stock/v931/InstitutionalDecisionBrief.tsx');
 const stock=read('components/StockClient.tsx');
 assert.match(brief,/describeSetupState/);
 assert.match(brief,/MARKET SETUP/);
 assert.match(brief,/WHAT IT MEANS/);
 assert.match(brief,/ACTION IMPLICATION/);
 assert.match(stock,/scenario=\{v5Analysis\?\.scenario/);
});

test('first screen exposes five decision metrics without an essential details expander',()=>{
 const brief=read('components/stock/v931/InstitutionalDecisionBrief.tsx');
 for(const label of ['ENTRY QUALITY','RELATIVE STRENGTH','PARTICIPATION','REWARD / RISK','VOLATILITY'])assert.match(brief,new RegExp(label));
 assert.doesNotMatch(brief,/<details/i);
});

test('market action map uses recovery/watch language when structure is damaged instead of calling it a preferred entry',()=>{
 const map=read('components/market/MarketActionMap.tsx');
 assert.match(map,/RECOVERY \/ WATCH ZONE/);
 assert.match(map,/newMoneyAction/);
 assert.match(map,/setup/);
});

test('legacy setup map is not rendered again inside Technicals after the canonical setup is promoted to first screen',()=>{
 const stock=read('components/StockClient.tsx');
 const technical=stock.slice(stock.indexOf('{tab==="technical"'),stock.indexOf('{tab==="options"'));
 assert.doesNotMatch(technical,/ScenarioMapPanel/);
});

test('one first-screen decision surface carries exact action levels and no duplicate canonical verdict',()=>{
 const brief=read('components/stock/v931/InstitutionalDecisionBrief.tsx');
 assert.match(brief,/MarketActionMap/);
 assert.match(brief,/WHY THIS CALL/);
 assert.match(brief,/WHAT UPGRADES IT/);
 assert.match(brief,/WHAT BREAKS IT/);
 assert.doesNotMatch(brief,/AURYN V8|REALITY AUDITED/);
});
