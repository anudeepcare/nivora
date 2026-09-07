import test from "node:test";
import assert from "node:assert/strict";
import {buildAurynV4CoreAnalysis} from "../.engine-test/auryn/v4/analyze.js";

const reason=(id,text)=>({id,text,evidenceIds:[id]});
const observation=(factor,score,state="MEASURED")=>({factor,score,reason:factor,evidenceIds:[`e:${factor}`],validationState:state});
const refsFor=(observations)=>observations.map(o=>({id:o.evidenceIds[0],key:o.factor,source:"PROVIDER",scope:"POINT_IN_TIME",asOf:"2026-09-07",validationState:o.validationState}));
const bundle=(over={})=>{
  const observations=over.observations??[
    observation("BUSINESS_QUALITY",85),observation("GROWTH_INFLECTION",78),observation("MOAT",82),observation("NARRATIVE_EXPECTATIONS",65),observation("FUNDAMENTALS_EARNINGS",84),observation("VALUATION",68),observation("TECHNICALS",70),observation("CATALYSTS",65),observation("SECTOR_INDUSTRY",70),observation("RISK",40)
  ];
  return{
    symbol:"TEST",asOf:"2026-09-07T18:00:00Z",
    classificationInput:{assetType:"stock",sector:"Technology",industry:"Software",description:"subscription software platform",revenue:1000,revenueGrowth:25,operatingMargin:22,fcf:150,profitable:true},
    evidenceRefs:refsFor(observations),evidenceConflicts:[],observations,
    moatSignals:[observation("MOAT",82)],moatReasons:{drivers:[reason("moat1","switching costs are strengthening")],threats:[]},slowEvidenceFingerprint:"slow-1",
    narrative:{market:[reason("m1","market expects steady growth")],auryn:[reason("a1","new product expands the addressable market")],expectationGapScore:68},
    thesisReasons:{positive:[reason("p1","durable growth and cash generation")],negative:[],marketMayBeMissing:[reason("a1","new product expands the addressable market")]},
    thesisInvalidators:["Revenue growth falls below 10% for two reported quarters"],hardVetoes:[],softConstraints:[],...over,
    observations,
    evidenceRefs:over.evidenceRefs??refsFor(observations)
  };
};

test("great company with weak technicals stays an investment BUY while NOW is HOLD",()=>{
  const observations=bundle().observations.map(o=>o.factor==="TECHNICALS"?{...o,score:25}:o);
  const x=buildAurynV4CoreAnalysis(bundle({observations,softConstraints:["TECHNICAL_INSTABILITY"]}));
  assert.equal(x.primaryAction,"BUY");
  assert.equal(x.horizonDecisions.find(h=>h.horizon==="NOW").action,"HOLD");
  assert.ok(["BUY","STRONG_BUY"].includes(x.horizonDecisions.find(h=>h.horizon==="THREE_TO_FIVE_YEARS").action));
});

test("frontier satellite validation case recognizes asymmetric BUY without STRONG_BUY",()=>{
  const observations=[observation("BUSINESS_QUALITY",40),observation("GROWTH_INFLECTION",82),observation("MOAT",88),observation("FUNDAMENTALS_EARNINGS",40),observation("VALUATION",60),observation("TECHNICALS",62),observation("CATALYSTS",90),observation("SECTOR_INDUSTRY",68),observation("RISK",72)];
  const x=buildAurynV4CoreAnalysis(bundle({symbol:"SAT",classificationInput:{assetType:"stock",sector:"Communication Services",industry:"Telecom Services",description:"direct-to-device satellite constellation with carrier partners and launch milestones",revenue:20,revenueGrowth:100,operatingMargin:-80,fcf:-500,profitable:false},observations,evidenceRefs:refsFor(observations),moatSignals:[observation("MOAT",88)],moatReasons:{drivers:[reason("moat-sat","spectrum and satellite architecture differentiate the network")],threats:[]},slowEvidenceFingerprint:"sat-slow",thesisReasons:{positive:[reason("sat-valid","carrier validation is advancing")],negative:[reason("sat-risk","execution and financing risk remain high")],marketMayBeMissing:[]}}));
  assert.equal(x.classification.businessModel,"SPACE_SATELLITE");
  assert.equal(x.analystModel.id,"frontier-pre-scale");
  assert.equal(x.primaryAction,"BUY");
  assert.notEqual(x.primaryAction,"STRONG_BUY");
});

test("memory semiconductor cycle inflection routes to cycle model and BUY",()=>{
  const observations=[observation("BUSINESS_QUALITY",70),observation("GROWTH_INFLECTION",85),observation("MOAT",60),observation("FUNDAMENTALS_EARNINGS",72),observation("VALUATION",70),observation("TECHNICALS",68),observation("CATALYSTS",70),observation("SECTOR_INDUSTRY",88),observation("MACRO_REGIME",65),observation("RISK",55)];
  const x=buildAurynV4CoreAnalysis(bundle({symbol:"MEM",classificationInput:{assetType:"stock",sector:"Technology",industry:"Semiconductors",description:"DRAM NAND memory producer",revenue:30000,revenueGrowth:45,operatingMargin:18,fcf:2000,profitable:true},observations,evidenceRefs:refsFor(observations),moatSignals:[observation("MOAT",60)],slowEvidenceFingerprint:"mem-slow"}));
  assert.equal(x.analystModel.id,"semiconductor-memory-cycle");
  assert.equal(x.primaryAction,"BUY");
});

test("technically strong stock cannot rescue a deteriorating long-term business",()=>{
  const observations=[observation("BUSINESS_QUALITY",38),observation("GROWTH_INFLECTION",35),observation("MOAT",40),observation("FUNDAMENTALS_EARNINGS",40),observation("VALUATION",65),observation("TECHNICALS",94),observation("CATALYSTS",78),observation("SECTOR_INDUSTRY",62),observation("RISK",55)];
  const x=buildAurynV4CoreAnalysis(bundle({observations,evidenceRefs:refsFor(observations),moatSignals:[observation("MOAT",40)],slowEvidenceFingerprint:"weak-2",priorThesis:{strength:70,evidenceFingerprint:"weak-1",lastMaterialChangeAt:"2026-08-01T00:00:00Z"},thesisReasons:{positive:[],negative:[reason("weak1","growth and cash quality deteriorated")],marketMayBeMissing:[]}}));
  assert.equal(x.thesis.direction,"WEAKENING");
  assert.equal(x.primaryAction,"REDUCE");
});

test("excellent company at extreme valuation is HOLD for new investment risk",()=>{
  const observations=[observation("BUSINESS_QUALITY",92),observation("GROWTH_INFLECTION",88),observation("MOAT",92),observation("FUNDAMENTALS_EARNINGS",90),observation("VALUATION",20),observation("TECHNICALS",75),observation("CATALYSTS",75),observation("SECTOR_INDUSTRY",80),observation("RISK",45)];
  const x=buildAurynV4CoreAnalysis(bundle({observations,evidenceRefs:refsFor(observations),moatSignals:[observation("MOAT",92)],slowEvidenceFingerprint:"premium",softConstraints:["EXTREME_VALUATION"]}));
  assert.equal(x.primaryAction,"HOLD");
  assert.ok(["HOLD","BUY"].includes(x.horizonDecisions.find(h=>h.horizon==="THREE_TO_FIVE_YEARS").action));
  assert.ok(x.reasonCodes.includes("VALUATION_CAPS_NEW_RISK"));
});

test("broken thesis sells even when valuation is cheap and technicals look strong",()=>{
  const observations=[observation("BUSINESS_QUALITY",20),observation("GROWTH_INFLECTION",22),observation("MOAT",20),observation("FUNDAMENTALS_EARNINGS",20),observation("VALUATION",92),observation("TECHNICALS",75),observation("CATALYSTS",60),observation("SECTOR_INDUSTRY",55),observation("RISK",40)];
  const x=buildAurynV4CoreAnalysis(bundle({observations,evidenceRefs:refsFor(observations),moatSignals:[observation("MOAT",20)],slowEvidenceFingerprint:"broken",thesisReasons:{positive:[],negative:[reason("broken1","core economics deteriorated")],marketMayBeMissing:[]}}));
  assert.equal(x.primaryAction,"SELL");
  assert.ok(x.reasonCodes.includes("THESIS_BROKEN"));
});

test("missing critical business evidence is INSUFFICIENT_EVIDENCE, not HOLD",()=>{
  const observations=bundle().observations.filter(o=>o.factor!=="BUSINESS_QUALITY");
  const x=buildAurynV4CoreAnalysis(bundle({observations,evidenceRefs:refsFor(observations)}));
  assert.equal(x.primaryAction,"INSUFFICIENT_EVIDENCE");
  assert.ok(x.reasonCodes.includes("CRITICAL_EVIDENCE_MISSING"));
});
