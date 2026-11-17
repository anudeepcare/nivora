import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs/promises';
import{buildHistoricalEventCalendar,renderHistoricalEventCalendar}from'../src/public/event-calendar-view.js';

const sections={
  earnings:{status:'available',data:[{source:'SentiSense Pro',data:[{date:'2026-10-29',epsActual:2.4,epsEstimate:2.1}]}]},
  news:{status:'available',data:[{source:'EODHD',data:[{date:'2026-11-04',headline:'Filed update'},{date:'2026-02-30',headline:'Invalid date'}]}]},
  income:{status:'available',data:[{source:'EODHD',data:[{date:'2026-11-11',value:.27,currency:'USD',paymentDate:'2026-11-14'}]}]}
};

test('historical event calendar groups strict dated provider records into real UTC months',()=>{
  const value=buildHistoricalEventCalendar(sections);
  assert.equal(value.status,'available');
  assert.deepEqual(value.months.map(month=>month.key),['2026-10','2026-11']);
  assert.deepEqual(value.months[1].events.map(event=>[event.day,event.category,event.label]),[[4,'news','Filed update'],[11,'dividends','Dividend']]);
  assert.equal(value.rejectedUndated,1);
});

test('historical calendar renders day cells and typed source evidence without claiming future events',()=>{
  const html=renderHistoricalEventCalendar(buildHistoricalEventCalendar(sections),value=>String(value));
  for(const term of['HISTORICAL EVENT CALENDAR','October 2026','November 2026','data-calendar-date="2026-11-04"','data-evidence-category="news"','Filed update','EPS actual 2.4','0.27 USD adjusted per share','1 invalid or undated record omitted','Not an upcoming calendar'])assert.match(html,new RegExp(term,'i'));
  assert.doesNotMatch(html,/next event|upcoming earnings|scheduled/i);
});

test('historical calendar stays unavailable when no strict dated records exist',()=>{
  const value=buildHistoricalEventCalendar({news:{status:'available',data:[{source:'EODHD',data:[{headline:'No date'}]}]}});
  assert.equal(value.status,'unavailable');
  assert.match(renderHistoricalEventCalendar(value),/No strictly dated historical records/);
});
test('historical calendar normalizes documented earnings documents and timestamped news dates',()=>{const value=buildHistoricalEventCalendar({earnings:{status:'available',data:[{source:'SentiSense Pro',data:{items:[{reportDate:'2026-10-29',epsActual:2.4}]}}]},news:{status:'available',data:[{source:'SentiSense Pro',data:{documents:[{sourceName:'Reuters',published:1793795400}]}},{source:'EODHD',data:[{title:'EOD update',date:'2026-11-04T15:30:00+00:00'}]}]}});assert.equal(value.status,'available');assert.deepEqual(value.events.map(row=>[row.date,row.category,row.label]),[['2026-10-29','earnings','Earnings report'],['2026-11-04','news','Reuters'],['2026-11-04','news','EOD update']]);assert.equal(value.rejectedUndated,0)});
test('historical calendar rejects timestamp strings without an explicit timezone',()=>{const value=buildHistoricalEventCalendar({news:{status:'available',data:[{source:'EODHD',data:[{title:'Ambiguous',date:'2026-11-04T15:30:00'}]}]}});assert.equal(value.status,'unavailable');assert.equal(value.rejectedUndated,1)});
test('historical calendar rejects impossible timestamp calendar components instead of rolling dates',()=>{const value=buildHistoricalEventCalendar({news:{status:'available',data:[{source:'EODHD',data:[{title:'Impossible',date:'2026-02-30T12:00:00Z'}]}]}});assert.equal(value.status,'unavailable');assert.equal(value.rejectedUndated,1)});
test('historical calendar uses native month disclosure and a seven-day contained grid',async()=>{const html=renderHistoricalEventCalendar(buildHistoricalEventCalendar(sections),value=>String(value)),css=await fs.readFile(new URL('../src/public/cockpit.css',import.meta.url),'utf8');assert.equal((html.match(/<details class="calendar-month"/g)||[]).length,2);assert.match(html,/<details class="calendar-month" open><summary>November 2026<\/summary>/);assert.match(html,/<details class="calendar-month"><summary>October 2026<\/summary>/);assert.match(css,/\.calendar-grid,\.calendar-weekdays\{display:grid;grid-template-columns:repeat\(7,1fr\)/);assert.match(css,/\.historical-calendar\{max-height:/)});
