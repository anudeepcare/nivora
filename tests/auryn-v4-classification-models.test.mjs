import test from "node:test";
import assert from "node:assert/strict";
import {classifyV4Security} from "../.engine-test/auryn/v4/classification.js";
import {selectAnalystModel} from "../.engine-test/auryn/v4/model-registry.js";

const e=(id,key)=>({id,key,source:"PROVIDER",scope:"POINT_IN_TIME",asOf:"2026-09-07",validationState:"MEASURED"});

test("space frontier company routes to SPACE_SATELLITE and VALIDATION",()=>{
  const x=classifyV4Security({
    assetType:"stock",sector:"Communication Services",industry:"Telecom Services",
    name:"Frontier Satellite",description:"direct-to-device satellite constellation with launch milestones and carrier partners",
    revenue:25,revenueGrowth:140,operatingMargin:-80,fcf:-500,profitable:false,
    evidence:[e("profile","industry"),e("filing","revenue")]
  });
  assert.equal(x.businessModel,"SPACE_SATELLITE");
  assert.ok(["VALIDATION","INFLECTION"].includes(x.lifecycle));
  assert.equal(x.profitabilityStage,"PRE_PROFIT");
  assert.ok(x.confidence>=0.65);
});

test("memory semiconductor is not classified like a software compounder",()=>{
  const x=classifyV4Security({assetType:"stock",sector:"Technology",industry:"Semiconductors",name:"MemoryCo",description:"DRAM and NAND memory producer",revenue:30000,revenueGrowth:55,operatingMargin:18,fcf:2000,profitable:true,evidence:[e("profile","industry")]});
  assert.equal(x.businessModel,"SEMICONDUCTOR_MEMORY_CYCLICAL");
  assert.equal(x.cyclicality,"HIGHLY_CYCLICAL");
});

test("classification confidence stays modest when evidence is generic",()=>{
  const x=classifyV4Security({assetType:"stock",name:"Unknown Corp",description:"technology company",evidence:[]});
  assert.equal(x.businessModel,"GENERAL_COMPOUNDER");
  assert.ok(x.confidence<0.6);
});


test("model registry selects frontier model for a satellite validation company",()=>{
  const c=classifyV4Security({assetType:"stock",industry:"Telecom Services",description:"direct-to-device satellite constellation",revenue:20,revenueGrowth:100,profitable:false,evidence:[e("p","industry")]});
  const m=selectAnalystModel(c);
  assert.equal(m.definition.id,"frontier-pre-scale");
  assert.ok(m.suitability>=0.65);
});

test("model registry selects memory-cycle model before generic technology",()=>{
  const c=classifyV4Security({assetType:"stock",industry:"Semiconductors",description:"DRAM NAND memory producer",revenue:1000,revenueGrowth:45,profitable:true,evidence:[e("p","industry")]});
  assert.equal(selectAnalystModel(c).definition.id,"semiconductor-memory-cycle");
});
