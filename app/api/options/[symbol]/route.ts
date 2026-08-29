import {NextResponse} from "next/server";
import {sharedJson,nowIso} from "@/lib/shared-cache";

type Contract={
  side:"call"|"put"; strike:number; openInterest:number; volume:number;
  gamma:number|null; delta:number|null; iv:number|null; mid:number|null;
  underlyingPrice:number|null; expiration:number|null; updated:number|null;
};

const num=(x:any)=>{const n=Number(x);return Number.isFinite(n)?n:null};
const arr=(x:any)=>Array.isArray(x)?x:[];
const fmtDate=(unix:number|null)=>unix?new Date(unix*1000).toISOString():null;

function decode(j:any):Contract[]{
  const side=arr(j.side),strike=arr(j.strike),oi=arr(j.openInterest),vol=arr(j.volume),
    gamma=arr(j.gamma),delta=arr(j.delta),iv=arr(j.iv),mid=arr(j.mid),
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
      underlyingPrice:num(under[i]),expiration:num(expiration[i]),updated:num(updated[i])
    });
  }
  return out;
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
      position,topNodes,
      note:"Gamma is derived from listed option Greeks and open interest. NIVORA does not know dealer inventory, so these are positioning proxies—not guaranteed support/resistance.",
      freshness:{checkedAt:nowIso(),cacheSeconds:21600}
    },{headers:{"Cache-Control":"public, s-maxage=21600, stale-while-revalidate=86400"}});
  }catch(e:any){
    return NextResponse.json({enabled:false,source:"MarketData.app",reason:e?.message||"Options data unavailable"},{status:200});
  }
}