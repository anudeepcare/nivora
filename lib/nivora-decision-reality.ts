
export type RealityLevel="LOW"|"MEDIUM"|"HIGH";
export type StabilizationState="CONFIRMED"|"WATCH"|"REQUIRED";
export type ScoreAttribution={label:string;weightPct:number;score:number|null;impactPoints:number|null;direction:"POSITIVE"|"NEGATIVE"|"NEUTRAL";evidence:string};

const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
const finite=(x:any)=>Number.isFinite(Number(x));
const n=(x:any,f=0)=>finite(x)?Number(x):f;
const round=(x:number,d=1)=>+x.toFixed(d);

export function roundPriceZone<T extends {low:number|null;high:number|null}>(zone:T,confidence:"High"|"Medium"|"Low",referencePrice:number):T{
  const px=Math.max(.01,Number(referencePrice)||1);
  const step=confidence==="High"?(px>=100?.1:px>=20?.05:.01):confidence==="Medium"?(px>=100?.5:px>=20?.25:.05):(px>=100?1:px>=20?.5:.1);
  const r=(v:number|null)=>v==null?null:+(Math.round(v/step)*step).toFixed(step<.1?2:step<1?2:0);
  return{...zone,low:r(zone.low),high:r(zone.high)};
}

function valuationRobustness(price:number,range:any,archetype?:string){
  if(!range||!finite(price)||price<=0)return{score:0,label:"UNAVAILABLE" as const,reason:"Decision-grade valuation is unavailable.",stressBear:null};
  const bear=n(range.bear),base=n(range.base),bull=n(range.bull),confidence=String(range.confidence||"Low");
  const bearUpside=(bear/price-1)*100,baseUpside=(base/price-1)*100,dispersion=(bull-bear)/Math.max(.01,base);
  let score=confidence==="High"?82:confidence==="Medium"?70:54;
  if(bearUpside>15)score-=Math.min(28,(bearUpside-15)*.55);
  if(baseUpside>65)score-=Math.min(22,(baseUpside-65)*.30);
  if(dispersion<.12)score-=10;
  if(dispersion>.65)score-=14;
  if(archetype==="hypergrowth"||archetype==="ai_infrastructure"||archetype==="pre_scale")score-=8;
  score=Math.round(clamp(score));
  const stressFactor=archetype==="pre_scale"?.60:archetype==="hypergrowth"||archetype==="ai_infrastructure"?.72:.80;
  return{
    score,
    label:score>=75?"ROBUST" as const:score>=55?"SENSITIVE" as const:"FRAGILE" as const,
    reason:score>=75?"Valuation remains reasonably stable under conservative scenario stress.":score>=55?"Valuation depends meaningfully on assumptions and deserves sensitivity review.":"Valuation is highly assumption-sensitive; do not treat headline upside as high-confidence expected return.",
    stressBear:+(bear*stressFactor).toFixed(2)
  };
}

function marketModelDisagreement(price:number,range:any){
  if(!range||!finite(price)||price<=0)return{level:"LOW" as RealityLevel,reason:"No decision-grade absolute valuation is available for market/model comparison.",bearUpsidePct:null,baseUpsidePct:null};
  const bear=(n(range.bear)/price-1)*100,base=(n(range.base)/price-1)*100;
  const level:RealityLevel=bear>20||base>80?"HIGH":bear>10||base>50?"MEDIUM":"LOW";
  const reason=level==="HIGH"?"Even the modeled bear case materially exceeds spot. The market may be pricing risk or information not captured by NIVORA's current assumptions.":level==="MEDIUM"?"Market price and modeled value differ enough to require an assumptions check before increasing conviction.":"Market price is reasonably consistent with the modeled scenario range.";
  return{level,reason,bearUpsidePct:+bear.toFixed(1),baseUpsidePct:+base.toFixed(1)};
}

function stabilization(technical:any,timingScore:number,timingLabel:string){
  const reasons:string[]=[];
  const d20=n(technical?.d20,0),d50=n(technical?.d50,0),d200=n(technical?.d200,0),drawdown=n(technical?.drawdown,0),vol=n(technical?.volRatio,1);
  let pressure=0;
  if(timingLabel==="WEAK"||timingScore<40){pressure+=35;reasons.push(`Timing is ${timingScore}/100 (${timingLabel}).`)}
  if(d20<-7){pressure+=18;reasons.push(`Price is ${Math.abs(d20).toFixed(1)}% below the 20D trend reference.`)}
  if(d50<-15){pressure+=18;reasons.push(`Price is ${Math.abs(d50).toFixed(1)}% below the 50D trend reference.`)}
  if(d200<-25){pressure+=12;reasons.push(`Price is ${Math.abs(d200).toFixed(1)}% below the 200D trend reference.`)}
  if(drawdown<-35){pressure+=12;reasons.push(`Drawdown is ${Math.abs(drawdown).toFixed(1)}% from the recent high.`)}
  if(vol>=1.5&&pressure>=35){pressure+=8;reasons.push("Heavy participation is occurring during a weak price regime.")}
  const state:StabilizationState=pressure>=55?"REQUIRED":pressure>=28?"WATCH":"CONFIRMED";
  return{state,score:Math.round(clamp(100-pressure)),reasons:reasons.slice(0,4),reason:state==="REQUIRED"?"Do not treat a lower price as automatically more attractive; stabilization is required before aggressive new capital.":state==="WATCH"?"Price structure remains mixed; staged capital should wait for better confirmation.":"Price structure is not showing a material falling-knife condition."};
}

function earlyWarning(input:any,disagreement:RealityLevel,stabilizationState:StabilizationState){
  const f=input.factors||{},reasons:string[]=[];let score=0;
  if(n(f.forward,50)<50){score+=24;reasons.push("Forward evidence is below neutral.")}
  if(n(f.financial,50)<45){score+=22;reasons.push("Financial quality is below the durable-thesis threshold.")}
  if(n(f.risk,50)>=70){score+=18;reasons.push("Risk pressure is elevated.")}
  if(String(input.newsTone||"").toLowerCase()==="negative"){score+=18;reasons.push("Recent material news is negative.")}
  if(disagreement==="HIGH"){score+=16;reasons.push("Market/model disagreement is high.")}
  if(stabilizationState==="REQUIRED"){score+=16;reasons.push("Price stabilization is required.")}
  score=Math.round(clamp(score));
  const level:RealityLevel=score>=55?"HIGH":score>=25?"MEDIUM":"LOW";
  return{score,level,reasons:reasons.slice(0,4),reason:level==="HIGH"?"Fast-moving evidence is elevated enough to constrain new risk until it improves.":level==="MEDIUM"?"Some fast-moving evidence is cautionary and should be monitored alongside the slower thesis.":"No major fast-moving warning cluster is active."};
}

function attribution(f:any,filingRisk=false,vetoCount=0):ScoreAttribution[]{
  const parts=[
    ["Business",.31,f.business,"Slow-moving business quality"],
    ["Durability",.18,f.durability,"Multi-year durability evidence"],
    ["Forward",.31,f.forward,"Forward growth, earnings/revisions and catalysts"],
    ["Earnings",.10,f.earnings,"Recent earnings execution"],
    ["Catalysts",.07,f.catalysts,"Material catalyst/news evidence"],
    ["Institutional",.03,f.institutional,"Reported ownership evidence"]
  ] as const;
  const rows:ScoreAttribution[]=parts.map(([label,w,score,evidence])=>{
    const s=finite(score)?Number(score):null,impact=s==null?null:round((s-50)*w,1);
    const direction:ScoreAttribution["direction"]=impact==null||Math.abs(impact)<.5?"NEUTRAL":impact>0?"POSITIVE":"NEGATIVE";
    return{label,weightPct:Math.round(w*100),score:s,impactPoints:impact,direction,evidence};
  });
  const penalties:Array<[string,number,boolean,string]>=[
    ["Financial floor",-11,n(f.financial,50)<35,"Financial quality below 35 triggers a thesis penalty."],
    ["Forward floor",-13,n(f.forward,50)<36,"Forward evidence below 36 triggers a thesis penalty."],
    ["Growth floor",-9,n(f.growth,50)<30,"Growth evidence below 30 triggers a thesis penalty."],
    ["Combined weakness",-6,n(f.financial,50)<45&&n(f.growth,50)<40,"Financial and growth weakness overlap."],
    ["Filing risk",-7,filingRisk,"Active financing/dilution filing risk."],
    ["Risk veto cap",-16,vetoCount>=2,"Two or more hard vetoes cap thesis conviction at 34."]
  ];
  for(const [label,impact,active,evidence] of penalties)if(active)rows.push({label,weightPct:0,score:null,impactPoints:impact,direction:"NEGATIVE",evidence});
  return rows.sort((a,b)=>Math.abs(b.impactPoints??0)-Math.abs(a.impactPoints??0));
}

export function buildDecisionReality(input:{
  price:number;
  valuationRange?:any;
  archetype?:string;
  timingScore:number;
  timingLabel:string;
  technical?:any;
  factors:Record<string,number|null>;
  newsTone?:string|null;
  thesisScore:number;
  opportunityScore:number;
  filingRisk?:boolean;
  vetoCount?:number;
}){
  const mm=marketModelDisagreement(input.price,input.valuationRange);
  const st=stabilization(input.technical||{},input.timingScore,input.timingLabel);
  const vr=valuationRobustness(input.price,input.valuationRange,input.archetype);
  const ew=earlyWarning(input,mm.level,st.state);
  return{marketModelDisagreement:mm,stabilization:st,valuationRobustness:vr,earlyWarning:ew,scoreAttribution:attribution(input.factors,Boolean(input.filingRisk),Number(input.vetoCount||0))};
}

export function technicalRealityFromCandles(market:any){
  const candles=Array.isArray(market?.candles)?market.candles:[],closes=candles.map((c:any)=>Number(c?.close)).filter((x:number)=>Number.isFinite(x)&&x>0);
  const vols=candles.map((c:any)=>Number(c?.volume)).filter((x:number)=>Number.isFinite(x)&&x>=0);
  const last=closes.at(-1)??(Number(market?.price)||0);
  const avg=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
  const sma=(p:number)=>closes.length>=p?avg(closes.slice(-p)):null;
  const d=(v:number|null)=>v&&last?((last/v)-1)*100:null;
  const high=closes.length?Math.max(...closes.slice(-Math.min(252,closes.length))):null;
  const v20=vols.length>=20?avg(vols.slice(-20)):null,latestV=vols.at(-1)??null;
  return{d20:d(sma(20)),d50:d(sma(50)),d200:d(sma(200)),drawdown:high&&last?((last/high)-1)*100:null,volRatio:v20&&latestV!=null?v20>0?latestV/v20:null:null};
}


export function applyRealityGuardToToday<T extends {action:string;blocked:boolean;reason:string;policyVersion:string}>(
  today:T,
  owns:boolean,
  reality:ReturnType<typeof buildDecisionReality>
):T{
  if(today.action!=="BUY"&&today.action!=="ADD")return today;
  const blockers:string[]=[];
  if(reality.stabilization.state==="REQUIRED")blockers.push("price stabilization is required");
  if(reality.earlyWarning.level==="HIGH")blockers.push("fast-moving early-warning risk is high");
  if(reality.marketModelDisagreement.level==="HIGH"&&reality.valuationRobustness.label==="FRAGILE")blockers.push("market/model disagreement is high while valuation robustness is fragile");
  if(!blockers.length)return today;
  return{...today,action:(owns?"HOLD":"WAIT") as T["action"],blocked:false,reason:`Reality guard withheld additional risk because ${blockers.join("; ")}.`};
}
