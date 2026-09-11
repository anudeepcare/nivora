import crypto from 'node:crypto';
import {buildInstitutionalDecisionKernel} from '../.engine-test/auryn/v931/decision-kernel.js';

const t=(o={})=>({trend:74,momentum:72,flow:68,structure:76,nearResistance:true,confirmedBreakout:true,structuralBreak:false,reclaimLevel:110,invalidation:90,...o});
const fixtures=[
 {name:'exceptional-confirmed',scores:{business:92,earningsRevisions:90,valuation:86,marketStructure:90,catalystsRegime:76,riskAsymmetry:84},technical:t({trend:86,momentum:82,flow:78,structure:88}),evidenceCompleteness:96,legacy:'HOLD'},
 {name:'clear-positive',scores:{business:76,earningsRevisions:70,valuation:64,marketStructure:70,catalystsRegime:56,riskAsymmetry:62},technical:t({trend:68,momentum:66,flow:62,structure:68,confirmedBreakout:false}),evidenceCompleteness:88,legacy:'HOLD'},
 {name:'starter-missing-valuation',scores:{business:72,earningsRevisions:64,valuation:null,marketStructure:63,catalystsRegime:52,riskAsymmetry:58},technical:t({trend:60,momentum:61,flow:55,structure:62,confirmedBreakout:false}),evidenceCompleteness:72,legacy:'HOLD'},
 {name:'mixed-wait',scores:{business:62,earningsRevisions:54,valuation:52,marketStructure:51,catalystsRegime:50,riskAsymmetry:50},technical:t({trend:50,momentum:50,flow:50,structure:50,nearResistance:false,confirmedBreakout:false}),evidenceCompleteness:82,legacy:'HOLD'},
 {name:'hard-avoid',scores:{business:34,earningsRevisions:32,valuation:40,marketStructure:28,catalystsRegime:42,riskAsymmetry:24},technical:t({trend:20,momentum:30,flow:30,structure:25,nearResistance:false,confirmedBreakout:false,structuralBreak:true}),evidenceCompleteness:90,legacy:'SELL'}
];
const rows=[];
for(let cycle=0;cycle<4;cycle++)for(const f of fixtures){
 const d=buildInstitutionalDecisionKernel({snapshotId:`fixture-${cycle}-${f.name}`,symbol:`FX${cycle}`,marketPrice:100,executionTradable:false,previousSetupState:null,scores:f.scores,technical:f.technical,evidenceCompleteness:f.evidenceCompleteness,canonicalAction:f.legacy,canonicalOwnerAction:'HOLD'});
 rows.push({fixture:f.name,cycle,action:d.newMoneyAction,ownerAction:d.ownerAction,score:d.decisionScore,evidenceCompleteness:d.evidenceCompleteness,legacyChallengerAction:d.legacyChallengerAction,hardVetoReasons:d.hardVetoReasons,policyReasons:d.policyReasons});
}
const counts={STRONG_BUY:0,BUY:0,START_SMALL:0,WAIT:0,AVOID:0};
const reasonCounts={};
for(const r of rows){counts[r.action]=(counts[r.action]||0)+1;for(const reason of r.policyReasons)reasonCounts[reason]=(reasonCounts[reason]||0)+1;}
const violations=[];
if(rows.some(r=>r.fixture!=='hard-avoid'&&r.legacyChallengerAction==='HOLD'&&r.hardVetoReasons.length))violations.push('LEGACY_HOLD_CREATED_HARD_VETO');
for(const action of Object.keys(counts))if(!counts[action])violations.push(`UNREACHABLE_${action}`);
const canonical={version:'auryn-v9.3.4.3',kind:'POLICY_REACHABILITY_FIXTURE_AUDIT',counts,reasonCounts,violations,rows};
const fingerprint=crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
const out={...canonical,fingerprint};
if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(out));
else console.log(JSON.stringify(out,null,2));
if(violations.length)process.exitCode=1;
