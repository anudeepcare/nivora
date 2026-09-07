import test from "node:test";
import assert from "node:assert/strict";
import {classifyV4Security} from "../.engine-test/auryn/v4/classification.js";
import {selectAnalystModel} from "../.engine-test/auryn/v4/model-registry.js";
import {classifySecurity as classifyLegacySecurity} from "../.engine-test/auryn/classification.js";
import {buildInvestorDecision} from "../.engine-test/nivora-investor.js";

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

test("legacy AI infrastructure archetype synchronizes V4 classification even when provider industry is generic",()=>{
  const x=classifyV4Security({assetType:"stock",industry:"Capital Markets",name:"Hybrid Infra",description:"bitcoin mining and digital infrastructure",archetypeHint:"ai_infrastructure",strategicTheme:"AI infrastructure / compute & power",revenue:500,revenueGrowth:60,profitable:false,evidence:[e("legacy-archetype","classification"),e("profile","industry")]});
  assert.equal(x.businessModel,"AI_DATA_CENTER_INFRA");
  assert.notEqual(x.lifecycle,"PRE_COMMERCIAL");
});

test("AI infrastructure model does not require a fragile point valuation to issue a decision",()=>{
  const c=classifyV4Security({assetType:"stock",description:"AI cloud GPU compute data center operator",revenue:500,revenueGrowth:70,profitable:false,evidence:[e("p","profile")]});
  const m=selectAnalystModel(c);
  assert.equal(m.definition.id,"ai-power-infrastructure");
  assert.equal(m.definition.requiredFactors.includes("VALUATION"),false);
});


test("hybrid mining company with explicit AI/HPC data-center business stays AI infrastructure",()=>{
  const x=classifyLegacySecurity({assetType:"stock",industry:"Mining",name:"Hybrid Compute",description:"bitcoin mining plus AI data center HPC GPU hosting and high-performance computing capacity"});
  assert.equal(x.archetype,"AI_INFRASTRUCTURE");
});


test("power infrastructure archetype stays infrastructure in the investor valuation path",()=>{
  const market={assetType:"stock",price:50,scores:{trend:50,technical:50,market:50},market:{score:50,regime:"neutral"},levels:{}};
  const company={assetType:"stock",rawMetrics:{revenue:1_000_000_000,revGrowth:30,niGrowth:20,opMargin:10,fcf:10_000_000,leverage:2,grossMargin:25},fundamentalSignal:{currentScore:60},fiveYearRecord:{score:65,revenueTrend:"Strong",history:[]}};
  const context={profile:{finnhubIndustry:"Electrical Equipment",name:"PowerCo",description:"fuel cell distributed power generation for AI data centers",marketCapitalization:15_000},metrics:{psTTM:10},recommendations:[],surprises:[],news:[],summary:{}};
  const d=buildInvestorDecision({market,company,context});
  assert.equal(d?.archetype,"infrastructure");
});
