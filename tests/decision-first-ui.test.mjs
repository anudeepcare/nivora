import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PaceInstrument} from './helpers/integrated-ui.mjs';
import {aurynDecision} from '../lib/auryn-decision.ts';
import {demoData} from './fixtures/demo.ts';
const research=demoData.research.MSFT;
const now=Date.parse(research.retrievedAt);
test('Pace presents every supported decision in its headline rather than substituting a price-zone code',()=>{
 const base=aurynDecision(research,{ownsPosition:true,now});
 for(const action of ['Buy','Add','Hold','Wait','Watch','Review','Reduce','Sell','Avoid']){
  const decision={...base,action,actionLabel:action,tone:['Sell','Reduce','Avoid'].includes(action)?'risk':['Wait','Watch','Review'].includes(action)?'caution':base.tone};
  const html=renderToStaticMarkup(React.createElement(PaceInstrument,{research,decision,now}));
  const title=html.match(/<h2>(.*?)<\/h2>/)?.[1];
  assert.equal(title,action==='Hold'?'Hold existing position':action==='Watch'?'Watch for an entry':action,action);
  assert.doesNotMatch(title,/Zone P|P0–P4/);
  assert.ok(html.includes(base.headline));
  assert.match(html,/Next price checkpoint/);
  if(['Sell','Reduce','Avoid'].includes(action)) assert.match(html,/data-tone="risk"/);
 }
});

test('short history retains the diamond framework and decision without repeated missing-data messages',()=>{
 const short={...research,history:research.history.slice(-80)};
 const html=renderToStaticMarkup(React.createElement(PaceInstrument,{research:short,now}));
 assert.match(html,/<h2>Review<\/h2>/);
 assert.equal((html.match(/Explore P[0-4]:/g)||[]).length,5);
 assert.doesNotMatch(html,/Date unavailable|Current history unavailable|More settled history|Price history needed/);
 assert.match(html,/What to review/);
});

test('business review headline does not conflate eligible and current price zones',()=>{
 const base=aurynDecision(research,{ownsPosition:false,now});
 const decision={...base,action:'Review',actionLabel:'Review business',pace:{...base.pace,level:2,eligibleLevel:1}};
 const html=renderToStaticMarkup(React.createElement(PaceInstrument,{research,decision,now}));
 assert.match(html,/<h2>Review business<\/h2>/);
 assert.match(html,/Price zone P2/);
 assert.doesNotMatch(html,/<h2>[^<]*P1/);
});
