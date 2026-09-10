import test from 'node:test';import assert from 'node:assert/strict';
const {marketCalendarAt}=await import('../.engine-test/nivora-market-session.js');

test('session matrix distinguishes premarket regular after-hours and closed reference states',()=>{
 assert.equal(marketCalendarAt(new Date('2026-09-10T12:00:00Z')).session,'PRE_MARKET');
 assert.equal(marketCalendarAt(new Date('2026-09-10T14:00:00Z')).session,'REGULAR');
 assert.equal(marketCalendarAt(new Date('2026-09-10T21:00:00Z')).session,'AFTER_HOURS');
 assert.equal(marketCalendarAt(new Date('2026-09-11T01:00:00Z')).session,'CLOSED');
});

test('weekends and exchange holidays are closed rather than pretending to have a live equity session',()=>{
 const weekend=marketCalendarAt(new Date('2026-09-12T16:00:00Z'));assert.equal(weekend.session,'CLOSED');assert.equal(weekend.isTradingDay,false);
 const holiday=marketCalendarAt(new Date('2026-07-03T16:00:00Z'));assert.equal(holiday.session,'CLOSED');assert.equal(holiday.calendarState,'HOLIDAY');
});

test('early-close day transitions to after-hours at 1pm New York time',()=>{
 const before=marketCalendarAt(new Date('2026-11-27T17:00:00Z'));assert.equal(before.calendarState,'EARLY_CLOSE');assert.equal(before.session,'REGULAR');
 const after=marketCalendarAt(new Date('2026-11-27T18:30:00Z'));assert.equal(after.calendarState,'EARLY_CLOSE');assert.equal(after.session,'AFTER_HOURS');
});
