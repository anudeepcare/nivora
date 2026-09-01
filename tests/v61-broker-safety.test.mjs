import {createRequire} from 'node:module';const require=createRequire(import.meta.url);import test from 'node:test';import assert from 'node:assert/strict';
const {authorizeBrokerExecution,ALPACA_PAPER_BASE_URL}=require('../.engine-test/nivora-broker.js');
test('paper mode can auto-submit',()=>assert.equal(authorizeBrokerExecution({mode:'paper',autoSubmit:true}).status,'AUTHORIZED'));
test('live mode always requires approval even if autoSubmit requested',()=>assert.equal(authorizeBrokerExecution({mode:'live',autoSubmit:true}).status,'APPROVAL_REQUIRED'));
test('Alpaca base URL is hard locked to paper trading',()=>assert.equal(ALPACA_PAPER_BASE_URL,'https://paper-api.alpaca.markets'));
