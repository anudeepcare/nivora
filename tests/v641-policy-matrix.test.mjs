
import test from "node:test";import assert from "node:assert/strict";
import {deriveTodayAction} from "../.engine-test/nivora-today.js";

const base={thesisScore:75,opportunityScore:70,companyScore:75,thesisLabel:"BULLISH",thesisState:"Intact",timing:{label:"ATTRACTIVE",score:70},valuationLabel:"Attractive",vetoes:[],consistency:{ok:true,notes:[]}};
const cases=[
 ["BUY",{...base},false,"BUY"],
 ["ADD",{...base},true,"ADD"],
 ["WAIT",{...base,timing:{label:"WEAK",score:25}},false,"WAIT"],
 ["HOLD",{...base,opportunityScore:50,timing:{label:"WAIT",score:50}},true,"HOLD"],
 ["TRIM",{...base,thesisScore:45,thesisState:"Weakening",timing:{label:"WAIT",score:45}},true,"TRIM"],
 ["SELL",{...base,thesisScore:20,thesisState:"Broken"},true,"SELL"],
 ["AVOID",{...base,thesisScore:40,thesisLabel:"BEARISH",thesisState:"Mixed"},false,"AVOID"],
 ["NO ACTION",{...base,thesisScore:60,opportunityScore:55,companyScore:60,thesisLabel:"NEUTRAL",thesisState:"Mixed",timing:{label:"WAIT",score:50}},false,"NO ACTION"]
];
test("canonical Today policy has reachable, distinct action states",()=>{
 const seen=new Set();
 for(const [name,input,owns,expected] of cases){
  const got=deriveTodayAction(input,owns).action;seen.add(got);assert.equal(got,expected,`${name} fixture`);
 }
 for(const expected of ["BUY","ADD","WAIT","HOLD","TRIM","SELL","AVOID","NO ACTION"])assert.ok(seen.has(expected),`${expected} must be reachable`);
});
