import test from'node:test';import assert from'node:assert/strict';
import{createLocalWorkspaceBackup,inspectLocalWorkspaceBackup,restoreLocalWorkspaceBackup}from'../src/public/local-backup.js';
import{defaultSettings,SETTINGS_KEY}from'../src/public/settings-state.js';

const EXPORTED_AT=new Date('2026-11-17T12:00:00Z');

test('local backup contains only browser settings, symbols, and transaction records',()=>{
  const transaction={symbol:'AAPL.US',type:'BUY',shares:1.25,price:100,fees:1,date:'2026-01-02',currency:'USD'};
  const result=createLocalWorkspaceBackup({settings:defaultSettings,watchlistSymbols:['AAPL.US','MSFT.US'],portfolioRaw:JSON.stringify([transaction]),exportedAt:EXPORTED_AT});
  assert.equal(result.status,'available');assert.equal(result.filename,'auryn-local-backup-2026-11-17.json');
  const parsed=JSON.parse(result.text);assert.equal(parsed.storage,'browser-local-only');assert.equal(parsed.accountSynced,false);assert.deepEqual(parsed.watchlist,['AAPL.US','MSFT.US']);assert.deepEqual(parsed.portfolio,{status:'valid',transactions:[transaction]});
  assert.doesNotMatch(result.text,/quote|provider|token|secret|api[_-]?key/i);
});

test('local backup preserves malformed portfolio storage for recovery instead of discarding it',()=>{
  const result=createLocalWorkspaceBackup({settings:defaultSettings,watchlistSymbols:[],portfolioRaw:'{broken',exportedAt:EXPORTED_AT});
  assert.equal(result.data.portfolio.status,'recovery-required');assert.equal(result.data.portfolio.raw,'{broken');assert.match(result.data.portfolio.warning,/Review it before sharing/);
});

test('local backup applies full portfolio validation before calling a transaction array valid',()=>{
  const oversell=JSON.stringify([{symbol:'AAPL.US',type:'SELL',shares:1,price:100,fees:0,date:'2026-01-02',currency:'USD'}]),result=createLocalWorkspaceBackup({settings:defaultSettings,portfolioRaw:oversell,exportedAt:EXPORTED_AT});
  assert.equal(result.data.portfolio.status,'recovery-required');assert.equal(result.data.portfolio.raw,oversell);
});

test('local backup rejects invalid symbols and invalid export clocks',()=>{
  assert.equal(createLocalWorkspaceBackup({watchlistSymbols:['<script>'],exportedAt:EXPORTED_AT}).status,'invalid');
  assert.equal(createLocalWorkspaceBackup({watchlistSymbols:[],exportedAt:new Date('invalid')}).status,'invalid');
});

test('validated workspace backup restores settings watchlist and transactions together',()=>{const transaction={symbol:'AAPL.US',type:'BUY',shares:1.25,price:100,fees:1,date:'2026-01-02',currency:'USD'},backup=createLocalWorkspaceBackup({settings:{...defaultSettings,theme:'daylight'},watchlistSymbols:['AAPL.US'],portfolioRaw:JSON.stringify([transaction]),exportedAt:EXPORTED_AT}),values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},inspected=inspectLocalWorkspaceBackup(backup.text,{asOf:'2026-11-17'});assert.equal(inspected.status,'valid');const result=restoreLocalWorkspaceBackup(storage,backup.text,{asOf:'2026-11-17'});assert.equal(result.status,'restored');assert.equal(JSON.parse(values.get(SETTINGS_KEY)).theme,'daylight');assert.deepEqual(JSON.parse(values.get('auryn.watchlist')),['AAPL.US']);assert.deepEqual(JSON.parse(values.get('auryn.portfolio')),[transaction])});

test('validated workspace backup round-trips an explicit browser-local cash balance',()=>{const backup=createLocalWorkspaceBackup({settings:defaultSettings,portfolioRaw:'[]',cashBalance:432.1,exportedAt:EXPORTED_AT}),values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},inspected=inspectLocalWorkspaceBackup(backup.text,{asOf:'2026-11-17'});assert.equal(inspected.status,'valid');assert.deepEqual(inspected.cash,{status:'available',amount:432.1,currency:'USD'});assert.equal(restoreLocalWorkspaceBackup(storage,backup.text,{asOf:'2026-11-17'}).status,'restored');assert.deepEqual(JSON.parse(values.get('auryn.portfolio.cash.v1')),{amount:432.1,currency:'USD'})});

test('restore rejects wrong schema duplicate symbols and recovery payloads without writes',()=>{const writes=[],storage={getItem:()=>null,setItem:(...args)=>writes.push(args),removeItem:()=>{}},base=createLocalWorkspaceBackup({settings:defaultSettings,watchlistSymbols:['AAPL.US'],portfolioRaw:'[]',exportedAt:EXPORTED_AT}).data;for(const value of[{...base,schema:'wrong'},{...base,watchlist:['AAPL.US','AAPL.US']},{...base,portfolio:{status:'recovery-required',raw:'secret-ish raw'}}])assert.equal(restoreLocalWorkspaceBackup(storage,JSON.stringify(value),{asOf:'2026-11-17'}).status,'invalid');assert.equal(writes.length,0)});

test('restore rolls back prior browser values if a storage write fails',()=>{const backup=createLocalWorkspaceBackup({settings:defaultSettings,watchlistSymbols:['AAPL.US'],portfolioRaw:'[]',exportedAt:EXPORTED_AT}),values=new Map([[SETTINGS_KEY,'old-settings'],['auryn.watchlist','old-watchlist'],['auryn.portfolio','old-portfolio']]),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{if(key==='auryn.portfolio'&&value!=='old-portfolio')throw new Error('quota');values.set(key,value)},removeItem:key=>values.delete(key)},result=restoreLocalWorkspaceBackup(storage,backup.text,{asOf:'2026-11-17'});assert.equal(result.status,'storage-error');assert.equal(values.get(SETTINGS_KEY),'old-settings');assert.equal(values.get('auryn.watchlist'),'old-watchlist');assert.equal(values.get('auryn.portfolio'),'old-portfolio')});
test('backup preserves corrupt cash storage as recovery data instead of silently exporting null',()=>{const result=createLocalWorkspaceBackup({settings:defaultSettings,portfolioRaw:'[]',cashState:{status:'invalid',raw:'{broken'},exportedAt:EXPORTED_AT});assert.equal(result.status,'available');assert.equal(result.data.cash.status,'recovery-required');assert.equal(result.data.cash.raw,'{broken');assert.equal(inspectLocalWorkspaceBackup(result.text,{asOf:'2026-11-17'}).status,'invalid')});
