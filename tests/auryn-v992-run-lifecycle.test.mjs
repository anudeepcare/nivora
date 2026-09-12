import test from "node:test";import assert from "node:assert/strict";
import {nextRunAttempt,runIdentityKey,jobAttemptIdempotencyKey,canResumeRun} from "../.engine-test/auryn/v992/run-lifecycle.js";

test("terminal validation runs are immutable and cannot resume",()=>{
 for(const s of ["PASS","FAIL","FAILED","CANCELLED"])assert.equal(canResumeRun(s),false,s);
 for(const s of ["PENDING","RUNNING"])assert.equal(canResumeRun(s),true,s);
});
test("same-day retry advances attempt and changes run identity",()=>{
 assert.equal(nextRunAttempt([]),1);
 assert.equal(nextRunAttempt([{attempt:1},{attempt:2}]),3);
 assert.notEqual(runIdentityKey("DAILY_CLOSE","2026-09-12","auryn-v9.8",1),runIdentityKey("DAILY_CLOSE","2026-09-12","auryn-v9.8",2));
});
test("job idempotency includes immutable run attempt",()=>{
 const a=jobAttemptIdempotencyKey("DAILY_CLOSE","2026-09-12","auryn-v9.8",1,0);
 const b=jobAttemptIdempotencyKey("DAILY_CLOSE","2026-09-12","auryn-v9.8",2,0);
 assert.notEqual(a,b);assert.match(b,/attempt-002/);
});
