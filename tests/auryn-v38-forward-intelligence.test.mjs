import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {buildInvestorDecision}=require("../.engine-test/nivora-investor.js");

const market=(over={})=>({price:100,assetType:"stock",scores:{risk:58,trend:50,momentum:48,flow:52,entry:48,extension:50},market:{regime:"RISK_ON",score:62},levels:{support:90,resistance:115},...over});
const context=(over={})=>({enabled:true,profile:{finnhubIndustry:"Software",description:"AI-powered software platform with growing enterprise demand"},metrics:{peTTM:38,psTTM:8},surprises:[{surprisePercent:-8},{surprisePercent:7},{surprisePercent:5}],recommendations:[{strongBuy:8,buy:6,hold:3,sell:0,strongSell:0},{strongBuy:7,buy:5,hold:4,sell:0,strongSell:0}],summary:{tone:"neutral"},news:[{headline:"Company expands AI capacity and customer demand remains strong",summary:"New capacity and customer wins support the multi-year growth runway",tone:"positive",materiality:"High"}],...over});

test("one weak quarter does not turn a strong multi-year business into reduce",()=>{
 const d=buildInvestorDecision({market:market(),company:{fundamentalSignal:{score:90},fiveYearRecord:{score:88,revenueTrend:"Strong",profitTrend:"Improving"},rawMetrics:{revGrowth:28,niGrowth:-10,opMargin:25,fcf:12,leverage:35,grossMargin:68}},context:context(),owns:true,position:{shares:100,avgCost:95}});
 assert.ok(["STRONG","CONSTRUCTIVE"].includes(d.canonical.longTerm.label));
 assert.ok(["HOLD","ADD","WATCH"].includes(d.canonical.owner.action));
 assert.notEqual(d.canonical.owner.action,"REDUCE");
 assert.notEqual(d.canonical.owner.action,"EXIT");
});

test("capital intensive AI growth separates runway from financing risk",()=>{
 const d=buildInvestorDecision({market:market({scores:{risk:65,trend:38,momentum:40,flow:45,entry:35,extension:42}}),company:{fundamentalSignal:{score:72},fiveYearRecord:{score:74,revenueTrend:"Strong",profitTrend:"Mixed"},filingRisk:false,rawMetrics:{revGrowth:60,niGrowth:15,opMargin:8,fcf:-20,leverage:70,grossMargin:42}},context:context({profile:{finnhubIndustry:"Technology",description:"AI cloud and data center infrastructure with GPU compute capacity and power assets"},news:[{headline:"New AI data center capacity contracted with customers",summary:"contracted capacity and demand expand forward runway",tone:"positive",materiality:"High"}]}),owns:true,position:{shares:100,avgCost:80}});
 assert.equal(d.archetype,"ai_infrastructure");
 assert.ok(d.strategicContext.score>=55);
 assert.ok(["STRONG","CONSTRUCTIVE","MIXED"].includes(d.canonical.longTerm.label));
 assert.notEqual(d.canonical.owner.action,"EXIT");
});

test("technicals change entry action more than long-term thesis",()=>{
 const company={fundamentalSignal:{score:91},fiveYearRecord:{score:89,revenueTrend:"Strong",profitTrend:"Strong"},rawMetrics:{revGrowth:32,niGrowth:25,opMargin:28,fcf:14,leverage:30,grossMargin:70}};
 const a=buildInvestorDecision({market:market({scores:{risk:45,trend:75,momentum:70,flow:65,entry:72,extension:40}}),company,context:context(),owns:false});
 const b=buildInvestorDecision({market:market({scores:{risk:75,trend:22,momentum:25,flow:30,entry:25,extension:35}}),company,context:context(),owns:false});
 assert.ok(Math.abs(a.canonical.longTerm.score-b.canonical.longTerm.score)<=3);
 assert.notEqual(a.canonical.entry.action,b.canonical.entry.action);
});
