import {clamp} from "@/lib/nivora-core";

export type ScanGeometry={
  entryLow:number;entryHigh:number;target1:number;target2:number;stop:number;
  rr:number|null;geometryValid:boolean;geometryReason?:string;
};

const finite=(x:any)=>Number.isFinite(Number(x));
const round=(x:number,d=2)=>Number(x.toFixed(d));

export function validateLongGeometry({entryLow,entryHigh,target1,target2,stop}:Omit<ScanGeometry,"rr"|"geometryValid"|"geometryReason">):ScanGeometry{
  const vals=[entryLow,entryHigh,target1,target2,stop];
  if(!vals.every(finite))return {entryLow:Number(entryLow)||0,entryHigh:Number(entryHigh)||0,target1:Number(target1)||0,target2:Number(target2)||0,stop:Number(stop)||0,rr:null,geometryValid:false,geometryReason:"Missing price level"};
  let lo=Math.min(entryLow,entryHigh),hi=Math.max(entryLow,entryHigh);
  const mid=(lo+hi)/2;
  if(lo<=0||hi<=0||stop<=0||target1<=0)return {entryLow:round(lo),entryHigh:round(hi),target1:round(target1),target2:round(target2),stop:round(stop),rr:null,geometryValid:false,geometryReason:"Non-positive price level"};
  if(stop>=mid)return {entryLow:round(lo),entryHigh:round(hi),target1:round(target1),target2:round(target2),stop:round(stop),rr:null,geometryValid:false,geometryReason:"Thesis break is not below planned entry"};
  if(target1<=mid)return {entryLow:round(lo),entryHigh:round(hi),target1:round(target1),target2:round(target2),stop:round(stop),rr:null,geometryValid:false,geometryReason:"Target is not above planned entry"};
  const risk=mid-stop,reward=target1-mid;
  if(risk/mid<0.004)return {entryLow:round(lo),entryHigh:round(hi),target1:round(target1),target2:round(target2),stop:round(stop),rr:null,geometryValid:false,geometryReason:"Risk distance is too small to be reliable"};
  const rr=reward/risk;
  if(!Number.isFinite(rr)||rr<=0||rr>12)return {entryLow:round(lo),entryHigh:round(hi),target1:round(target1),target2:round(target2),stop:round(stop),rr:null,geometryValid:false,geometryReason:"Reward/risk failed sanity bounds"};
  return {entryLow:round(lo),entryHigh:round(hi),target1:round(target1),target2:round(Math.max(target1,target2)),stop:round(stop),rr:round(rr,2),geometryValid:true};
}

export function classifyScanAction(x:{score:number;entry:number;risk:number;trend:number;momentum:number;flow:number;extension:number;geometryValid:boolean;rr:number|null}){
  const {score,entry,risk,trend,momentum,flow,extension,geometryValid,rr}=x;
  if(risk>=86||(trend<30&&momentum<38)||score<34)return "AVOID / EXIT WATCH";
  if(extension>=84&&trend>=60)return "DON'T CHASE";
  if(geometryValid&&score>=80&&entry>=66&&risk<70&&trend>=58&&momentum>=52&&flow>=45&&(rr??0)>=1.35)return "BUY / START";
  if(geometryValid&&score>=72&&entry>=58&&risk<76&&trend>=55&&(rr??0)>=1.2)return "START / PULLBACK";
  if(trend>=68&&momentum>=60&&flow>=52&&extension<72)return "WATCH BREAKOUT";
  if(score>=64&&entry>=52)return "WATCH ENTRY";
  if(score>=54)return "WAIT";
  return "AVOID";
}

export function categoryForScan(x:{action:string;trend:number;momentum:number;flow:number;extension:number;price:number;e20:number}){
  const {action,trend,momentum,flow,extension,price,e20}=x;
  if(action==="BUY / START"||action==="START / PULLBACK")return "Best now";
  if(action.includes("EXIT")||action==="AVOID")return "Exit watch";
  if(trend>=66&&momentum>=60&&extension<66)return "Early momentum";
  if(trend>=60&&price<=e20*1.035)return "Quality pullback";
  if(flow>=64&&momentum>=58)return "In play";
  return "Watch";
}

export function rankScanCandidate(x:{score:number;confidence:number;entry:number;risk:number;trend:number;momentum:number;flow:number;extension:number;rr:number|null;geometryValid:boolean}){
  const rrScore=x.geometryValid&&x.rr!=null?clamp((x.rr-1)*28+50,20,92):30;
  const riskSafety=100-x.risk;
  const penalty=(x.extension>82?10:0)+(x.geometryValid?0:12);
  return Math.round(clamp(
    x.score*.38+x.confidence*.14+x.entry*.14+riskSafety*.10+x.trend*.08+x.momentum*.06+x.flow*.04+rrScore*.06-penalty,
    0,100
  ));
}
