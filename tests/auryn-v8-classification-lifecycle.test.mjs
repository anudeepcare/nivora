import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyV4Security} from '../.engine-test/auryn/v4/classification.js';
import {selectAnalystModel} from '../.engine-test/auryn/v4/model-registry.js';
import {resolveValuationMethod} from '../.engine-test/auryn/v6/valuation-registry.js';
const e=(id='p')=>({id,key:'profile',source:'PROVIDER',scope:'POINT_IN_TIME',asOf:'2026-09-07',validationState:'MEASURED'});

test('digital-health platform is not misclassified as biotech/pharma',()=>{
  const c=classifyV4Security({assetType:'stock',sector:'Health Care',industry:'Health Care Technology',name:'Consumer Health Platform',description:'digital health telehealth subscription platform connecting consumers to clinicians and personalized treatment',revenue:2_000,revenueGrowth:35,operatingMargin:5,fcf:100,profitable:true,evidence:[e()]});
  assert.equal(c.businessModel,'DIGITAL_HEALTH_PLATFORM');
  assert.equal(selectAnalystModel(c).definition.id,'digital-health-platform');
  assert.equal(resolveValuationMethod(c).method,'GROWTH_EV_SALES_FCF');
});

test('frontier satellite with missing lifecycle metrics never defaults to maturity',()=>{
  const c=classifyV4Security({assetType:'stock',sector:'Communication Services',industry:'Telecom Services',name:'Satellite Frontier',description:'direct-to-device satellite constellation under commercial deployment with carrier partners',profitable:false,evidence:[e()]});
  assert.equal(c.businessModel,'SPACE_SATELLITE');
  assert.notEqual(c.lifecycle,'MATURITY');
  assert.ok(['PRE_COMMERCIAL','VALIDATION','UNKNOWN'].includes(c.lifecycle));
});

test('generic company with insufficient lifecycle evidence is UNKNOWN rather than MATURITY',()=>{
  const c=classifyV4Security({assetType:'stock',sector:'Technology',name:'Sparse Evidence Co',description:'technology company',evidence:[e()]});
  assert.equal(c.lifecycle,'UNKNOWN');
});

test('data-center REIT remains REIT instead of becoming AI infrastructure',()=>{
  const c=classifyV4Security({assetType:'reit',sector:'Real Estate',industry:'Specialized REITs',name:'Data Center REIT',description:'real estate investment trust owning global data centers and colocation facilities',revenue:8_000,revenueGrowth:12,profitable:true,evidence:[e()]});
  assert.equal(c.businessModel,'REIT');
  assert.equal(c.assetClass,'REIT');
});
