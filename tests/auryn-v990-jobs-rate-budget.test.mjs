import test from "node:test";import assert from "node:assert/strict";
import {BACKGROUND_CALLS_PER_MINUTE,PROVIDER_CALLS_PER_MINUTE,retryDelaySeconds,jobIdempotencyKey} from "../.engine-test/auryn/v99/jobs.js";
test("background budget preserves interactive headroom",()=>{assert.equal(PROVIDER_CALLS_PER_MINUTE,55);assert.equal(BACKGROUND_CALLS_PER_MINUTE,42);assert.ok(PROVIDER_CALLS_PER_MINUTE-BACKGROUND_CALLS_PER_MINUTE>=10)});
test("job identities are deterministic and retry delays back off",()=>{assert.equal(jobIdempotencyKey("DAILY_CLOSE","2026-09-12",3),jobIdempotencyKey("DAILY_CLOSE","2026-09-12",3));assert.deepEqual([0,1,2,3].map(retryDelaySeconds),[30,60,120,240])});
