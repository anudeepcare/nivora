import test from 'node:test';
import assert from 'node:assert/strict';
import {buildUpcomingEarningsCalendar,renderUpcomingEarningsCalendar} from '../src/public/upcoming-events-view.js';

const section={status:'available',data:[{source:'EODHD',data:{earnings:[
  {code:'AAPL.US',report_date:'2026-12-10',before_after_market:'AfterMarket',estimate:2.1,currency:'USD'},
  {code:'MSFT.US',report_date:'2026-12-11',before_after_market:'BeforeMarket',estimate:3.2,currency:'USD'},
  {code:'AAPL.US',report_date:'2026-02-30',estimate:1}
]}}]};

test('upcoming earnings accepts only strict future dates for the requested canonical security',()=>{const value=buildUpcomingEarningsCalendar(section,'AAPL.US',{now:new Date('2026-11-17T12:00:00Z')});assert.equal(value.status,'available');assert.equal(value.events.length,1);assert.deepEqual(value.events[0],{date:'2026-12-10',day:10,month:'2026-12',source:'EODHD',symbol:'AAPL.US',session:'AfterMarket',estimate:2.1,currency:'USD'});assert.equal(value.rejected,2)});
test('upcoming earnings renders source timing estimate and explicit unverified-live status',()=>{const html=renderUpcomingEarningsCalendar(buildUpcomingEarningsCalendar(section,'AAPL.US',{now:new Date('2026-11-17T12:00:00Z')}),String);for(const term of['UPCOMING EARNINGS CALENDAR','December 2026','2026-12-10','AfterMarket','EPS estimate 2.1 USD','EODHD','LIVE CONTRACT UNVERIFIED','2 mismatched or invalid records omitted'])assert.match(html,new RegExp(term));assert.doesNotMatch(html,/MSFT|2026-02-30/)});
test('upcoming earnings stays unavailable for absent provider data',()=>{const value=buildUpcomingEarningsCalendar({status:'unavailable'},'AAPL.US',{now:new Date('2026-11-17T12:00:00Z')});assert.equal(value.status,'unavailable');assert.match(renderUpcomingEarningsCalendar(value,String),/Unavailable/)});
