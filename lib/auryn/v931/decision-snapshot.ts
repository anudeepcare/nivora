import type {CanonicalMarketSnapshot} from '../market-truth';
import {V931_VERSION,type DecisionSnapshot} from './domain';

function stable(value:unknown):unknown{
 if(Array.isArray(value))return value.map(stable);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));
 if(typeof value==='number'&&!Number.isFinite(value))return null;
 return value;
}
export function stableStringify(value:unknown){return JSON.stringify(stable(value));}
export function stableFingerprint(value:unknown){const s=stableStringify(value);let h1=2166136261,h2=2246822519;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,16777619);h2=Math.imul(h2^c,3266489917);}return `${(h1>>>0).toString(36)}${(h2>>>0).toString(36)}`;}
export function buildDecisionSnapshot(input:{symbol:string;asOf:string;marketTruth:CanonicalMarketSnapshot;completedDailyBarCutoff:string|null;fundamentalsAsOf:string|null;earningsAsOf:string|null;estimatesAsOf:string|null;newsCutoff:string|null;macroAsOf:string|null;featureVersion:string;modelVersion:string;policyVersion:string;evidence:Record<string,unknown>}):DecisionSnapshot{
 const canonical={symbol:String(input.symbol).toUpperCase(),asOf:input.asOf,marketTruth:input.marketTruth,completedDailyBarCutoff:input.completedDailyBarCutoff,fundamentalsAsOf:input.fundamentalsAsOf,earningsAsOf:input.earningsAsOf,estimatesAsOf:input.estimatesAsOf,newsCutoff:input.newsCutoff,macroAsOf:input.macroAsOf,featureVersion:input.featureVersion,modelVersion:input.modelVersion,policyVersion:input.policyVersion,evidence:input.evidence};
 const fingerprint=stableFingerprint(canonical);
 return{version:V931_VERSION,snapshotId:`${canonical.symbol}-${fingerprint}`,fingerprint,...canonical};
}
