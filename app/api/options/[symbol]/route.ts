import {NextResponse} from "next/server";
import {sharedJson,nowIso} from "@/lib/shared-cache";

type Contract={
  side:"call"|"put"; strike:number; openInterest:number; volume:number;
  gamma:number|null; delta:number|null; iv:number|null; mid:number|null;
  bid:number|null; ask:number|null; theta:number|null; vega:number|null;
  underlyingPrice:number|null; expiration:number|null; updated:number|null;
};

const num=(x:any)=>{const n=Number(x);return Number.isFinite(n)?n:null};
const arr=(x:any)=>Array.isArray(x)?x:[];
const fmtDate=(unix:number|null)=>unix?new Date(unix*1000).toISOString():null;

function decode(j:any):Contract[]{
  const side=arr(j.side),strike=arr(j.strike),oi=arr(j.openInterest),vol=arr(j.volume),
    gamma=arr(j.gamma),delta=arr(j.delta),iv=arr(j.iv),mid=arr(j.mid),
    bid=arr(j.bid),ask=arr(j.ask),theta=arr(j.theta),vega=arr(j.vega),
    under=arr(j.underlyingPrice),expiration=arr(j.expiration),updated=arr(j.updated);
  const n=Math.max(side.length,strike.length,oi.length,vol.length,gamma.length);
  const out:Contract[]=[];
  for(let i=0;i<n;i++){
    const st=num(strike[i]); if(st==null)continue;
    const s=String(side[i]||"").toLowerCase();
    if(s!=="call"&&s!=="put")continue;
    out.push({
      side:s as "call"|"put",strike:st,openInterest:num(oi[i])??0,volume:num(vol[i])??0,
      gamma:num(gamma[i]),delta:num(delta[i]),iv:num(iv[i]),mid:num(mid[i]),
      bid:num(bid[i]),ask:num(ask[i]),theta:num(theta[i]),vega:num(vega[i]),
      underlyingPrice:num(under[i]),expiration:num(expiration[i]),updated:num(updated[i])
    });
  }
  return out;
}

const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
const dte=(unix:number|null)=>unix?Math.max(0,Math.ceil((unix*1000-Date.now())/86400000)):null;
const spreadPct=(x:Contract)=>{
  if(x.bid==null||x.ask==null||x.ask<=0)return null;
  const m=x.mid??((x.bid+x.ask)/2); return m>0?((x.ask-x.bid)/m)*100:null;
};
const intrinsic=(x:Contract,spot:number)=>x.side==="call"?Math.max(0,spot-x.strike):Math.max(0,x.strike-spot);
const extrinsic=(x:Contract,spot:number)=>{
  if(x.mid==null)return null;
  return Math.max(0,x.mid-intrinsic(x,spot));
};
function contractScore(x:Contract,spot:number,style:"conservative"|"balanced"|"aggressive"|"leaps"){
  const days=dte(x.expiration)??0, absDelta=Math.abs(x.delta??0);
  const liqOI=clamp(Math.log10(Math.max(1,x.openInterest))*22);
  const liqVol=clamp(Math.log10(Math.max(1,x.volume))*18);
  const sp=spreadPct(x); const spreadScore=sp==null?45:clamp(100-sp*6);
  const deltaTarget=style==="conservative"?0.70:style==="balanced"?0.58:style==="aggressive"?0.38:0.72;
  const deltaScore=clamp(100-Math.abs(absDelta-deltaTarget)*180);
  const dteTarget=style==="conservative"?75:style==="balanced"?60:style==="aggressive"?35:450;
  const dteWidth=style==="leaps"?420:90;
  const dteScore=clamp(100-Math.abs(days-dteTarget)/dteWidth*100);
  const moneyness=Math.abs(x.strike/spot-1)*100;
  const moneyScore=clamp(100-moneyness*(style==="aggressive"?3.5:5.5));
  const thetaPenalty=x.theta!=null&&x.mid?clamp(Math.abs(x.theta/x.mid)*1000):35;
  const ivPenalty=x.iv!=null?clamp((x.iv*100-25)*.55):25;
  const base=liqOI*.16+liqVol*.10+spreadScore*.20+deltaScore*.22+dteScore*.18+moneyScore*.14;
  const penalty=thetaPenalty*.06+ivPenalty*.04;
  return Math.round(clamp(base-penalty));
}
function candidate(x:Contract,spot:number,style:"conservative"|"balanced"|"aggressive"|"leaps"){
  const days=dte(x.expiration), sp=spreadPct(x), score=contractScore(x,spot,style);
  const premium=x.mid!=null?x.mid*100:null;
  const breakEven=x.mid!=null?(x.side==="call"?x.strike+x.mid:x.strike-x.mid):null;
  const leverage=x.mid&&x.delta!=null?Math.abs((x.delta*spot)/x.mid):null;
  const ext=extrinsic(x,spot);
  return {
    style,side:x.side,strike:x.strike,expiration:fmtDate(x.expiration),dte:days,
    bid:x.bid,ask:x.ask,mid:x.mid,premium:premium!=null?Number(premium.toFixed(0)):null,
    delta:x.delta,gamma:x.gamma,theta:x.theta,vega:x.vega,iv:x.iv!=null?Number((x.iv*100).toFixed(1)):null,
    openInterest:x.openInterest,volume:x.volume,spreadPct:sp!=null?Number(sp.toFixed(1)):null,
    breakEven:breakEven!=null?Number(breakEven.toFixed(2)):null,
    leverage:leverage!=null?Number(leverage.toFixed(1)):null,
    extrinsic:ext!=null?Number((ext*100).toFixed(0)):null,score
  };
}
function rankedSet(rows:Contract[],spot:number,side:"call"|"put",style:"conservative"|"balanced"|"aggressive"|"leaps"){
  const min=style==="leaps"?250:style==="aggressive"?14:30;
  const max=style==="leaps"?900:style==="aggressive"?75:180;
  return rows.filter(x=>x.side===side&&(dte(x.expiration)??-1)>=min&&(dte(x.expiration)??9999)<=max&&x.mid!=null&&x.mid>0)
    .map(x=>candidate(x,spot,style))
    .sort((a,b)=>b.score-a.score).slice(0,3);
}

export async function GET(_:Request,{params}:{params:Promise<{symbol:string}>}){
  const {symbol:raw}=await params; const symbol=decodeURIComponent(raw).toUpperCase();
  const token=process.env.MARKETDATA_TOKEN;
  if(!token)return NextResponse.json({enabled:false,reason:"MARKETDATA_TOKEN is not configured.",source:"MarketData.app"});
  if(symbol.includes("/"))return NextResponse.json({enabled:false,reason:"Options intelligence is currently for optionable US-listed underlyings.",source:"MarketData.app"});
  try{
    // Default chain avoids pulling every expiration. On free accounts this data is at least 24h delayed.
    const url=`https://api.marketdata.app/v1/options/chain/${encodeURIComponent(symbol)}/?minOpenInterest=1`;
    const j=await sharedJson(url,["marketdata","options-chain",symbol],21600,5000,{
      Authorization:`Bearer ${token}`,Accept:"application/json"
    });
    if(j?.s==="error")throw new Error(j.errmsg||"Options provider error");
    const rows=decode(j);
    if(!rows.length)return NextResponse.json({enabled:true,source:"MarketData.app",status:"no_data",contracts:0,freshness:{checkedAt:nowIso()}});
    const spot=rows.find(x=>x.underlyingPrice!=null)?.underlyingPrice??null;
    const byStrike=new Map<number,{strike:number,callOI:number,putOI:number,callVol:number,putVol:number,gammaWeight:number,netGammaProxy:number,callMid:number|null,putMid:number|null,ivs:number[]}>();
    for(const x of rows){
      let g=byStrike.get(x.strike);
      if(!g){g={strike:x.strike,callOI:0,putOI:0,callVol:0,putVol:0,gammaWeight:0,netGammaProxy:0,callMid:null,putMid:null,ivs:[]};byStrike.set(x.strike,g)}
      if(x.side==="call"){g.callOI+=x.openInterest;g.callVol+=x.volume;if(x.mid!=null)g.callMid=x.mid}
      else {g.putOI+=x.openInterest;g.putVol+=x.volume;if(x.mid!=null)g.putMid=x.mid}
      if(x.gamma!=null){
        const w=Math.abs(x.gamma)*x.openInterest;
        g.gammaWeight+=w;
        // This is an OI-based directional proxy, not observed dealer inventory.
        g.netGammaProxy+=(x.side==="call"?1:-1)*x.gamma*x.openInterest;
      }
      if(x.iv!=null&&x.iv>0)g.ivs.push(x.iv);
    }
    const levels=[...byStrike.values()];
    const callWall=levels.reduce((a,b)=>b.callOI>a.callOI?b:a,levels[0]);
    const putWall=levels.reduce((a,b)=>b.putOI>a.putOI?b:a,levels[0]);
    const gammaNode=levels.reduce((a,b)=>b.gammaWeight>a.gammaWeight?b:a,levels[0]);
    const totalCallOI=rows.filter(x=>x.side==="call").reduce((a,x)=>a+x.openInterest,0);
    const totalPutOI=rows.filter(x=>x.side==="put").reduce((a,x)=>a+x.openInterest,0);
    const totalCallVol=rows.filter(x=>x.side==="call").reduce((a,x)=>a+x.volume,0);
    const totalPutVol=rows.filter(x=>x.side==="put").reduce((a,x)=>a+x.volume,0);
    const netProxy=levels.reduce((a,x)=>a+x.netGammaProxy,0);
    let atm:any=null;
    if(spot!=null){
      atm=levels.filter(x=>x.callMid!=null&&x.putMid!=null).sort((a,b)=>Math.abs(a.strike-spot)-Math.abs(b.strike-spot))[0]||null;
    }
    const expectedMovePct=atm&&spot?((Number(atm.callMid)+Number(atm.putMid))/spot)*100:null;
    const atmIV=atm?.ivs?.length?atm.ivs.reduce((a:number,b:number)=>a+b,0)/atm.ivs.length:null;
    const maxUpdated=Math.max(...rows.map(x=>x.updated||0));
    const expirations=[...new Set(rows.map(x=>x.expiration).filter(Boolean))].sort((a:any,b:any)=>a-b);
    const topNodes=levels.sort((a,b)=>b.gammaWeight-a.gammaWeight).slice(0,5).map(x=>({
      strike:x.strike,callOI:x.callOI,putOI:x.putOI,gammaConcentration:Number(x.gammaWeight.toFixed(4))
    }));
    const position=spot==null?"Context unavailable":
      spot>(callWall?.strike??Infinity)?"Price above largest call-OI strike":
      spot<(putWall?.strike??-Infinity)?"Price below largest put-OI strike":
      "Price between largest put/call OI strikes";
    const contractSetups=spot==null?null:{
      bullish:{
        conservative:rankedSet(rows,spot,"call","conservative"),
        balanced:rankedSet(rows,spot,"call","balanced"),
        aggressive:rankedSet(rows,spot,"call","aggressive"),
        leaps:rankedSet(rows,spot,"call","leaps")
      },
      bearish:{
        conservative:rankedSet(rows,spot,"put","conservative"),
        balanced:rankedSet(rows,spot,"put","balanced"),
        aggressive:rankedSet(rows,spot,"put","aggressive"),
        leaps:rankedSet(rows,spot,"put","leaps")
      }
    };
    return NextResponse.json({
      enabled:true,source:"MarketData.app",dataMode:"24h delayed on free/trial entitlement",
      contracts:rows.length,underlyingPrice:spot,
      expiration:fmtDate(expirations[0] as number|null),
      updatedAt:maxUpdated?fmtDate(maxUpdated):null,
      callWall:callWall?.strike??null,putWall:putWall?.strike??null,gammaNode:gammaNode?.strike??null,
      putCallOI:totalCallOI?Number((totalPutOI/totalCallOI).toFixed(2)):null,
      putCallVolume:totalCallVol?Number((totalPutVol/totalCallVol).toFixed(2)):null,
      expectedMovePct:expectedMovePct!=null?Number(expectedMovePct.toFixed(2)):null,
      atmIV:atmIV!=null?Number((atmIV*100).toFixed(1)):null,
      gammaProxy:netProxy>0?"Positive OI-weighted gamma proxy":netProxy<0?"Negative OI-weighted gamma proxy":"Neutral OI-weighted gamma proxy",
      position,topNodes,contractSetups,
      rankingNote:"Contract scores prioritize liquidity, spread quality, delta fit, time-to-expiration and moneyness, with theta/IV penalties. They rank candidates; they are not an instruction to trade.",
      note:"Gamma is derived from listed option Greeks and open interest. NIVORA does not know dealer inventory, so these are positioning proxies—not guaranteed support/resistance.",
      freshness:{checkedAt:nowIso(),cacheSeconds:21600}
    },{headers:{"Cache-Control":"public, s-maxage=21600, stale-while-revalidate=86400"}});
  }catch(e:any){
    return NextResponse.json({enabled:false,source:"MarketData.app",reason:e?.message||"Options data unavailable"},{status:200});
  }
}