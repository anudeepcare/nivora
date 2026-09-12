import {createHash} from "node:crypto";
import {buildAurynCioAssessment} from "../v97/cio-engine";
import {buildThreeClockState} from "../v98/three-clock";
import {buildFundamentalScenarioSpectrum} from "../v98/fundamental-scenarios";
import {GOLDEN_FIXTURES} from "./golden-fixtures";
type S="PASS"|"WATCH"|"FAIL";
const check=(id:string,ok:boolean,detail:string,statusIfFalse:S="FAIL")=>({id,status:(ok?"PASS":statusIfFalse) as S,detail});
export function runAurynValidationLab(){
 const checks:Array<{id:string;status:S;detail:string}>=[];
 const actions=new Set<string>();
 for(const f of GOLDEN_FIXTURES){const x=buildAurynCioAssessment(f.input);actions.add(x.newMoneyAction);const ok=f.expected.includes(x.newMoneyAction)&&f.expected.includes(x.longTermAction);checks.push(check(`GOLDEN_${f.id.toUpperCase().replaceAll("-","_")}`,ok,`${x.newMoneyAction}/${x.longTermAction}`));}
 checks.push(check("ACTION_REACHABILITY",["STRONG_BUY","START_SMALL","WAIT","AVOID"].every(x=>actions.has(x)),`reachable=${[...actions].sort().join(",")}`));
 const base={business:88,earnings:78,moat:90,reinvestment:86,cashConversion:82,capitalAllocation:80,revisions:72,catalysts:60,technical:75};
 const a=buildThreeClockState(base),b=buildThreeClockState({...base,technical:15});
 checks.push(check("THREE_CLOCK_ISOLATION",a.thesis.score===b.thesis.score&&b.tactical.score<a.tactical.score,`thesis ${a.thesis.score}->${b.thesis.score}; tactical ${a.tactical.score}->${b.tactical.score}`));
 const intrinsic={bearValue:70,baseValue:120,bullValue:170,horizonYears:3,confidence:82,basis:"golden independent valuation"};
 const va=buildFundamentalScenarioSpectrum({...intrinsic,marketPrice:80}),vb=buildFundamentalScenarioSpectrum({...intrinsic,marketPrice:140});
 checks.push(check("VALUATION_INDEPENDENCE",Boolean(va&&vb&&va.base.value===vb.base.value&&va.base.impliedAnnualReturnPct!==vb.base.impliedAnnualReturnPct),"Base intrinsic value invariant to spot"));
 checks.push(check("NO_FAKE_SCENARIO",buildFundamentalScenarioSpectrum({bearValue:null,baseValue:null,bullValue:null,horizonYears:3,confidence:0,basis:"missing",marketPrice:100})===null,"Missing intrinsic inputs remain unavailable"));
 const fail=checks.filter(x=>x.status==="FAIL").length,watch=checks.filter(x=>x.status==="WATCH").length;
 const status:S=fail?"FAIL":watch?"WATCH":"PASS";
 const canonical={schemaVersion:"auryn-v9.9-validation-lab-1",status,checks};
 const fingerprint=createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
 return{...canonical,fingerprint};
}
