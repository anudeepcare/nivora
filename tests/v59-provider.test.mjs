import test from "node:test";import assert from "node:assert/strict";
import {coalesceRequest,providerHealthSnapshot,recordProviderResult,resetProviderResilienceForTests} from "../.engine-test/provider-resilience.js";

test("identical in-flight provider requests are coalesced",async()=>{resetProviderResilienceForTests();let calls=0;const load=()=>coalesceRequest("quote:IREN",async()=>{calls++;await new Promise(r=>setTimeout(r,15));return 42});const [a,b]=await Promise.all([load(),load()]);assert.equal(a,42);assert.equal(b,42);assert.equal(calls,1)});

test("provider health exposes degraded state after failures",()=>{resetProviderResilienceForTests();recordProviderResult("twelvedata",false,500);recordProviderResult("twelvedata",false,500);recordProviderResult("twelvedata",false,500);const h=providerHealthSnapshot("twelvedata");assert.equal(h.status,"DEGRADED");assert.equal(h.failures,3)});
