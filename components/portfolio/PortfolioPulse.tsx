"use client";
import {useMemo,useState} from "react";
import {calculatePortfolioPeriod,type PortfolioPeriod} from "@/lib/v65/portfolio";
import {ArrowUpRight,ChevronDown,Sparkles,WalletCards,ShieldCheck,Layers3} from "lucide-react";
import PortfolioVisualAnalytics from "./PortfolioVisualAnalytics";
import PortfolioBrief from "./PortfolioBrief";
import PortfolioXRay from "./PortfolioXRay";
import PortfolioHealth from "./PortfolioHealth";
const PERIODS=["1D","1W","1M","3M","6M","YTD","1Y","2Y","3Y","4Y","ALL"] as const;

export default function PortfolioPulse({pulse,risk}:{pulse:any;risk?:any}){
 const[period,setPeriod]=useState<(typeof PERIODS)[number]>("1M");
 const[deepOpen,setDeepOpen]=useState(false);
 const r=useMemo(()=>calculatePortfolioPeriod(pulse?.history?.points||[],period as PortfolioPeriod),[pulse,period]);
 const actions=(pulse?.actions||[]).filter((x:any)=>x.portfolioAction&&x.portfolioAction!=="LEAVE_ALONE");
 const buckets=useMemo(()=>{
  const deploy=actions.filter((x:any)=>["ADD","BUY"].includes(String(x.portfolioAction))).slice(0,3);
  const review=actions.filter((x:any)=>["WATCH","TRIM_RISK","AVOID","SELL","EXIT"].includes(String(x.portfolioAction))).slice(0,3);
  const hold=actions.filter((x:any)=>["HOLD","WAIT"].includes(String(x.portfolioAction))).slice(0,3);
  return{deploy,hold,review};
 },[actions]);
 const cash=Number(pulse?.allocations?.cashPct||0),health=Number(pulse?.health?.score||0),largest=Number(pulse?.concentration?.largestPositionPct||0);
 const actual=r?.status==="ACTUAL";
 const portfolioReturn=actual&&Number.isFinite(Number(r?.portfolioReturnPct))?Number(r.portfolioReturnPct):null;
 const alpha=actual&&Number.isFinite(Number(r?.alphaVsSpyPct))?Number(r.alphaVsSpyPct):null;
 const interpretation=alpha!=null?`${period}: ${alpha>=0?"ahead of":"behind"} SPY by ${Math.abs(alpha).toFixed(2)}%. ${largest>18?"Concentration deserves attention.":"Position sizing remains controlled."}`:`NIVORA is building exact performance history. Current decisions use position size, concentration and company evidence.`;
 return <section className="portfolioPulse portfolioV2Pulse">
  <section className="pv2Command portfolioGlass">
   <div className="pv2CommandLead"><span className="pulseEyebrow"><Sparkles size={13}/> PORTFOLIO PULSE</span><h1>${Number(pulse?.totalValue||0).toLocaleString(undefined,{maximumFractionDigits:0})}</h1><p>{interpretation}</p></div>
   <div className="pv2CommandMetrics">
    <article><span>RETURN · {period}</span><b className={portfolioReturn!=null&&portfolioReturn<0?"bad":portfolioReturn!=null?"good":""}>{portfolioReturn==null?"Building":`${portfolioReturn>=0?"+":""}${portfolioReturn.toFixed(2)}%`}</b><small>{alpha==null?"Exact history required":`${alpha>=0?"+":""}${alpha.toFixed(2)}% vs SPY`}</small></article>
    <article><span>CASH</span><b>{cash.toFixed(1)}%</b><small>Available flexibility</small></article>
    <article><span>HEALTH</span><b>{health}<em>/100</em></b><small>{pulse?.health?.label||"Current"}</small></article>
    <article><span>LARGEST</span><b>{largest.toFixed(1)}%</b><small>Single position</small></article>
   </div>
  </section>

  <nav className="pulsePeriods pv2Periods" aria-label="Portfolio analysis period">{PERIODS.map(x=><button key={x} className={period===x?"on":""} onClick={()=>setPeriod(x)}>{x}</button>)}</nav>

  <section className="pv2CapitalMap">
   <div className="pulseSectionHead"><div><small>CAPITAL MAP</small><h2>What deserves your attention</h2></div><span>Evidence first. No forced trades.</span></div>
   <div className="pv2Buckets">
    <CapitalBucket tone="deploy" icon={<ArrowUpRight size={17}/>} label="DEPLOY" title={buckets.deploy.length?`${buckets.deploy.length} opportunities`:"No forced buys"} items={buckets.deploy} empty="No holding currently clears NIVORA's evidence bar for new capital."/>
    <CapitalBucket tone="hold" icon={<WalletCards size={17}/>} label="HOLD / WAIT" title={buckets.hold.length?`${buckets.hold.length} stay patient`:"Stay selective"} items={buckets.hold} empty="Keep capital selective while evidence develops."/>
    <CapitalBucket tone="review" icon={<ShieldCheck size={17}/>} label="REVIEW" title={buckets.review.length?`${buckets.review.length} need attention`:"No urgent risks"} items={buckets.review} empty="No portfolio change requires urgent attention."/>
   </div>
  </section>

  <PortfolioVisualAnalytics pulse={pulse} periodResult={r}/>

  <button className="pv2DeepToggle" type="button" onClick={()=>setDeepOpen(v=>!v)} aria-expanded={deepOpen}><span><Layers3 size={17}/><b>Portfolio evidence</b><small>Health, analyst brief and exposure details</small></span><ChevronDown size={18} className={deepOpen?"open":""}/></button>
  {deepOpen?<div className="pv2Deep"><PortfolioHealth pulse={pulse}/><PortfolioBrief pulse={pulse} periodResult={r} period={period}/><PortfolioXRay pulse={pulse} risk={risk}/></div>:null}
 </section>
}

function CapitalBucket({tone,icon,label,title,items,empty}:{tone:string;icon:React.ReactNode;label:string;title:string;items:any[];empty:string}){
 return <article className={`pv2Bucket ${tone}`}><header><i>{icon}</i><div><small>{label}</small><h3>{title}</h3></div></header>{items.length?<div className="pv2BucketItems">{items.map((x:any)=><div key={x.symbol}><b>{x.symbol}</b><span>{String(x.portfolioAction).replaceAll("_"," ")}</span><small>{x.reason}</small></div>)}</div>:<p>{empty}</p>}</article>
}
