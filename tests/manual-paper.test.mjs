import test from 'node:test';import assert from 'node:assert/strict';
import {validateManualTicket,checkManualRisk} from '../lib/manual-paper.mjs';
const body={symbol:'IREN',side:'BUY',quantity:10,limitPrice:25,requestId:'11111111-1111-4111-8111-111111111111'};
const context={now:100000,clockOpen:true,configuration:{no_shorting:true,max_margin_multiplier:"1"},market:{session:'REGULAR',executionTradable:true,priceSensitiveAllowed:true,executionPrice:25,executionPriceAsOf:new Date(99000).toISOString()},account:{cash:10000,equity:10000,buyingPower:10000},positions:[{symbol:'IREN',qty:20,availableQty:20}]};
test('valid paper limit ticket preserves exact user quantity',()=>assert.equal(validateManualTicket(body).quantity,10));
test('rejects missing, negative and fractional quantities',()=>{for(const quantity of [null,'10',0,-1,1.5])assert.throws(()=>validateManualTicket({...body,quantity}));});
test('rejects arbitrary sides and invalid symbols',()=>{assert.throws(()=>validateManualTicket({...body,side:'SHORT'}));assert.throws(()=>validateManualTicket({...body,symbol:'BTC/USD'}));});
test('requires fresh regular-session execution quote',()=>{for(const extra of [{clockOpen:false},{market:{...context.market,executionTradable:false}},{market:{...context.market,executionPriceAsOf:new Date(0).toISOString()}}])assert.throws(()=>checkManualRisk(body,{...context,...extra}));});
test('prevents cash overspend and oversized buys',()=>{assert.throws(()=>checkManualRisk({...body,quantity:500},context));assert.throws(()=>checkManualRisk(body,{...context,account:{cash:100,equity:10000,buyingPower:100}}));});
test('prevents short sales',()=>assert.throws(()=>checkManualRisk({...body,side:'SELL',quantity:21},context)));
test('rejects a limit price far from verified quote',()=>assert.throws(()=>checkManualRisk({...body,limitPrice:40},context)));
test('allows a verified cash-funded buy and owned sell',()=>{assert.equal(checkManualRisk(body,context).notional,250);assert.equal(checkManualRisk({...body,side:'SELL'},context).notional,250);});

test("requires broker-enforced no leverage and no shorting protections",()=>{for(const configuration of [undefined,{}, {no_shorting:false,max_margin_multiplier:"1"},{no_shorting:true,max_margin_multiplier:"2"}])assert.throws(()=>checkManualRisk(body,{...context,configuration}));});
test("accounts for broker reserved buying power and available shares",()=>{assert.throws(()=>checkManualRisk(body,{...context,account:{...context.account,buyingPower:10}}));assert.throws(()=>checkManualRisk({...body,side:"SELL"},{...context,positions:[{symbol:"IREN",qty:20,availableQty:5}]}));});
