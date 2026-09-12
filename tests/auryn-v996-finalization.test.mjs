import test from "node:test";import assert from "node:assert/strict";
import {evaluateRunCompletion} from "../.engine-test/auryn/v996/finalization.js";
const good={symbol:"AAPL",market_price:1,new_money_action:"WAIT",owner_action:"HOLD",long_term_action:"SELECTIVE",decision_score:60,evidence_completeness:83,setup_state:"TRENDING",evidence_fingerprint:"e",snapshot_fingerprint:"s"};
test("PASS requires all expected jobs and complete distinct shadow evidence",()=>{assert.equal(evaluateRunCompletion({expected:2,jobs:[{status:"DONE"},{status:"DONE"}],snapshots:[good,{...good,symbol:"MSFT"}]}).status,"PASS")});
test("open jobs remain RUNNING",()=>{assert.equal(evaluateRunCompletion({expected:2,jobs:[{status:"DONE"},{status:"PENDING"}],snapshots:[good]}).status,"RUNNING")});
test("terminal missing or incomplete evidence cannot PASS",()=>{assert.equal(evaluateRunCompletion({expected:2,jobs:[{status:"DONE"},{status:"DONE"}],snapshots:[good,{...good,symbol:"MSFT",owner_action:null}]}).status,"FAIL")});
