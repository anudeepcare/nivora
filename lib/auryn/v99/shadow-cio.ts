import {createHash} from "node:crypto";
const stable=(v:any):string=>{if(v===null||typeof v!=="object")return JSON.stringify(v);if(Array.isArray(v))return `[${v.map(stable).join(",")}]`;return `{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`};
export type ShadowSnapshotInput={modelVersion:string;symbol:string;evaluationDate:string;runKind:string;marketPrice:number|null;decision:Record<string,unknown>;evidenceFingerprint:string};
export function fingerprintShadowSnapshot(x:ShadowSnapshotInput){return createHash("sha256").update(stable({...x,symbol:x.symbol.toUpperCase()})).digest("hex")}
function add(date:string,n:number,unit:"d"|"m"|"y"){const d=new Date(`${date}T12:00:00Z`);if(unit==="d")d.setUTCDate(d.getUTCDate()+n);if(unit==="m")d.setUTCMonth(d.getUTCMonth()+n);if(unit==="y")d.setUTCFullYear(d.getUTCFullYear()+n);return d.toISOString().slice(0,10)}
export type OutcomeHorizon="1W"|"1M"|"3M"|"6M"|"1Y"|"3Y"|"5Y";
export function outcomeDueAt(date:string,h:OutcomeHorizon){return h==="1W"?add(date,7,"d"):h==="1M"?add(date,1,"m"):h==="3M"?add(date,3,"m"):h==="6M"?add(date,6,"m"):h==="1Y"?add(date,1,"y"):h==="3Y"?add(date,3,"y"):add(date,5,"y")}
export const OUTCOME_HORIZONS:OutcomeHorizon[]=["1W","1M","3M","6M","1Y","3Y","5Y"];
