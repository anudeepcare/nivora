import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultSettings,normalizeSettings,readSettings,saveSettings,SETTINGS_KEY,intelligenceSignalsMatch,resolveResearchTab} from '../src/public/settings-state.js';
import {settingsPage} from '../src/public/settings-view.js';
import fs from 'node:fs/promises';

function memory(initial){const data=new Map(initial?[[SETTINGS_KEY,initial]]:[]);return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),value:()=>data.get(SETTINGS_KEY)}}

test('settings defaults match every observed published-reference state',()=>{
  assert.deepEqual(normalizeSettings(),defaultSettings);
  const html=settingsPage(defaultSettings);
  for(const label of ['30-second glance','Deep research','Swing context','Daylight','Night','Indigo','Teal','Orange','Large readable type','Congressional transactions','Insider transactions','Institutional ownership','Options exposure','Technical indicators','Material thesis change','Pace confirmation','Earnings preparation','Congressional or insider filing','Estimate revision','Maximum position','Maximum loss per idea','Cash reserve'])assert.match(html,new RegExp(label));
  assert.match(html,/Immediate/);assert.match(html,/7 days before/);assert.match(html,/Daily digest/);assert.match(html,/8\.0%/);assert.match(html,/1\.0%/);assert.match(html,/10\.0%/);
  assert.match(html,/documented options summary, OI walls, and unusual contracts/i);assert.doesNotMatch(html,/Include GEX, OI, vanna/);
});

test('user-editable observed preferences persist locally and invalid state fails to defaults',()=>{
  const storage=memory();
  saveSettings(storage,{...defaultSettings,experience:'deep',theme:'daylight',accent:'teal',largeType:false,signals:{...defaultSettings.signals,congress:false}});
  const restored=readSettings(storage);
  assert.equal(restored.experience,'deep');assert.equal(restored.theme,'daylight');assert.equal(restored.accent,'teal');assert.equal(restored.largeType,false);assert.equal(restored.signals.congress,false);
  assert.deepEqual(readSettings(memory('{broken')),defaultSettings);
});

test('alert planning preferences round-trip only allowlisted values without claiming delivery',()=>{
  const customized=normalizeSettings({...defaultSettings,alerts:{thesis:'Daily digest',pace:'Off',earnings:'3 days before',filings:'Immediate',estimates:'Off'}});
  assert.deepEqual(customized.alerts,{thesis:'Daily digest',pace:'Off',earnings:'3 days before',filings:'Immediate',estimates:'Off'});
  const invalid=normalizeSettings({...defaultSettings,alerts:{thesis:'SMS now',pace:null,earnings:'2 days before',filings:true,estimates:'Weekly'}});
  assert.deepEqual(invalid.alerts,defaultSettings.alerts);
  const storage=memory();saveSettings(storage,customized);assert.deepEqual(readSettings(storage).alerts,customized.alerts);
});

test('decision policy guardrails persist only finite bounded percentages',()=>{
  const customized=normalizeSettings({...defaultSettings,policy:{maxPosition:15.5,maxLoss:2.5,cashReserve:25}});
  assert.deepEqual(customized.policy,{maxPosition:15.5,maxLoss:2.5,cashReserve:25});
  const invalid=normalizeSettings({...defaultSettings,policy:{maxPosition:0,maxLoss:21,cashReserve:101}});
  assert.deepEqual(invalid.policy,defaultSettings.policy);
  const storage=memory();saveSettings(storage,customized);assert.deepEqual(readSettings(storage).policy,customized.policy);
});

test('notification planning controls are editable local preferences while delivery remains unavailable',()=>{
  const html=settingsPage(defaultSettings);
  assert.match(html,/Notification delivery is not implemented/);
  assert.match(html,/Planning preference only/);
  assert.match(html,/Review thresholds only/);
  assert.equal((html.match(/data-alert=/g)||[]).length,5);
  assert.equal((html.match(/data-alert="[^"]+"[^>]*disabled/g)||[]).length,0);
  assert.match(html,/data-alert="earnings"/);assert.match(html,/3 days before/);assert.match(html,/Off/);
  for(const key of['maxPosition','maxLoss','cashReserve'])assert.match(html,new RegExp(`data-policy="${key}"`));
});
test('settings mount persists alert planning changes through normalized storage',async()=>{const js=await fs.readFile(new URL('../src/public/settings-view.js',import.meta.url),'utf8');assert.match(js,/querySelectorAll\('\[data-alert\]'\)/);assert.match(js,/alerts:\{\.\.\.value\.alerts/);assert.match(js,/saveSettings/)});
test('settings mount saves edited policy values through the same normalized storage path',async()=>{const js=await fs.readFile(new URL('../src/public/settings-view.js',import.meta.url),'utf8');assert.match(js,/querySelectorAll\('\[data-policy\]'\)/);assert.match(js,/policy:\{\.\.\.value\.policy/);assert.match(js,/saveSettings/)});
test('saved appearance and signal preferences affect the application, while account signs out server-side',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');for(const term of ['initialSettings.theme','initialSettings.accent','initialSettings.largeType','settings.signals.technicals','settings.signals.options',"fetch('/api/session',{method:'DELETE'})"])assert.match(js,new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))});
test('Data & Signals preferences are forwarded to the allowlisted intelligence request',async()=>{const js=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');for(const term of ['intelligenceRequestUrl','institutions:String(settings.signals.institutions)','insiders:String(settings.signals.insiders)','congress:String(settings.signals.congress)','options:String(settings.signals.options)'])assert.ok(js.includes(term),term)});
test('cached intelligence is eligible only for the exact current provider-signal selection',()=>{
  const intelligence={controls:{signals:{institutions:true,insiders:true,congress:true,options:true}}};
  assert.equal(intelligenceSignalsMatch(intelligence,defaultSettings),true);
  assert.equal(intelligenceSignalsMatch(intelligence,{...defaultSettings,signals:{...defaultSettings.signals,options:false}}),false);
  assert.equal(intelligenceSignalsMatch({controls:{}},defaultSettings),false);
});
test('research restoration never reopens a tab hidden by current settings',()=>{
  const noTechnical={...defaultSettings,signals:{...defaultSettings.signals,technicals:false}};
  assert.equal(resolveResearchTab('technicals',noTechnical),'atlas');
  assert.equal(resolveResearchTab('indicators',noTechnical),'atlas');
  const noOwnership={...defaultSettings,signals:{...defaultSettings.signals,institutions:false,insiders:false,congress:false}};
  assert.equal(resolveResearchTab('ownership',noOwnership),'atlas');
  assert.equal(resolveResearchTab('options',{...defaultSettings,signals:{...defaultSettings.signals,options:false}}),'atlas');
  assert.equal(resolveResearchTab(null,{...defaultSettings,experience:'swing'}),'technicals');
  assert.equal(resolveResearchTab('pace',noTechnical),'pace');
});
test('settings clearly offers a browser-local archive without an account-sync claim',()=>{const html=settingsPage(defaultSettings);assert.match(html,/Download local workspace archive/);assert.match(html,/Recovery payloads preserve original raw content; review before sharing/);assert.match(html,/settings, watchlist symbols, transaction records, and the explicit USD cash balance/i);assert.doesNotMatch(html,/Manual extraction only/);assert.match(html,/not account-synced/)});
test('settings offers an explicit validated local workspace restore control',()=>{const html=settingsPage(defaultSettings);assert.match(html,/data-import-local/);assert.match(html,/Restore validated archive/);assert.match(html,/replace settings, watchlist, transactions, and cash balance together/i)});
