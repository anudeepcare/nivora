
import {summarizeCalibration,type CalibrationRow} from "./nivora-calibration-v62";

export type CalibrationRegime="RISK_ON"|"NEUTRAL"|"RISK_OFF"|"UNKNOWN";
export type CalibrationCohortRow=CalibrationRow&{horizon:string;regime:CalibrationRegime};

export function summarizeCalibrationCohorts(rows:CalibrationCohortRow[],minimum=30){
  const groups=new Map<string,CalibrationCohortRow[]>();
  for(const r of rows){
    const key=`${r.archetype||"unknown"}|${r.horizon||"unknown"}|${r.regime||"UNKNOWN"}`;
    const xs=groups.get(key)||[];xs.push(r);groups.set(key,xs);
  }
  return[...groups.entries()].map(([key,xs])=>({key,archetype:xs[0]?.archetype||"unknown",horizon:xs[0]?.horizon||"unknown",regime:xs[0]?.regime||"UNKNOWN",summary:summarizeCalibration(xs,minimum)})).sort((a,b)=>b.summary.n-a.summary.n);
}

export function reliabilityDisplay(summary:{status:string;n:number;minimum:number;hitRatePct:number;avgAlphaPct:number;brierScore:number;expectedCalibrationErrorPct:number}){
  if(summary.status!=="CALIBRATED")return{label:"Collecting",headline:`${summary.n}/${summary.minimum} matured comparable observations`,usable:false};
  return{label:"Calibrated",headline:`N=${summary.n} · hit ${summary.hitRatePct}% · alpha ${summary.avgAlphaPct>=0?"+":""}${summary.avgAlphaPct}% · Brier ${summary.brierScore} · ECE ${summary.expectedCalibrationErrorPct}%`,usable:true};
}
