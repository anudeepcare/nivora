
import test from "node:test";
import assert from "node:assert/strict";
import {evaluateBuyCalibration} from "../.engine-test/nivora-buy-calibration.js";

test("strong compounder can earn a starter path with imperfect but non-falling-knife timing",()=>{
 const x=evaluateBuyCalibration({
  thesisScore:84,opportunityScore:63,companyScore:86,thesisLabel:"BULLISH",thesisState:"Intact",
  timing:{label:"WEAK",score:38},valuationLabel:"Fair",vetoes:[],consistency:{ok:true},
  archetype:"compounder",factors:{financial:72,growth:80,forward:78,risk:44},
  valuationAvailable:true,valuationRobustness:"ROBUST",stabilizationState:"WATCH",
  marketModelDisagreement:"LOW",earlyWarningLevel:"LOW"
 });
 assert.equal(x.eligible,true);
 assert.equal(x.tier,"STARTER");
 assert.match(String(x.path),/STARTER|QUALITY/);
});

test("strong growth name can earn a starter path with imperfect timing when no falling-knife guard is active",()=>{
 const x=evaluateBuyCalibration({
  thesisScore:84,opportunityScore:66,companyScore:80,thesisLabel:"BULLISH",thesisState:"Intact",
  timing:{label:"WEAK",score:40},valuationLabel:"Fair",vetoes:[],consistency:{ok:true},
  archetype:"hypergrowth",factors:{financial:62,growth:92,forward:82,risk:45},
  valuationAvailable:false,valuationRobustness:"UNAVAILABLE",stabilizationState:"WATCH",
  marketModelDisagreement:"LOW",earlyWarningLevel:"LOW"
 });
 assert.equal(x.eligible,true);
 assert.equal(x.tier,"STARTER");
});

test("required stabilization still blocks starter capital",()=>{
 const x=evaluateBuyCalibration({
  thesisScore:90,opportunityScore:80,companyScore:90,thesisLabel:"BULLISH",thesisState:"Intact",
  timing:{label:"WEAK",score:35},valuationLabel:"Attractive",vetoes:[],consistency:{ok:true},
  archetype:"compounder",factors:{financial:85,growth:90,forward:90,risk:30},
  valuationAvailable:true,valuationRobustness:"ROBUST",stabilizationState:"REQUIRED",
  marketModelDisagreement:"LOW",earlyWarningLevel:"LOW"
 });
 assert.equal(x.eligible,false);
 assert.match(x.primaryBlocker,/stabilization/i);
});
