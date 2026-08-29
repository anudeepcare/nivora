import {NextResponse} from "next/server";
const POS=["beat","beats","raise","raises","raised","growth","record","contract","award","partnership","approval","upgrade","expands","launch","profit","buyback","reaffirm","exceed"];
const NEG=["miss","misses","lower","lowers","cut","cuts","downgrade","offering","dilution","lawsuit","investigation","delay","weak","decline","loss","secondary","shelf","subpoena","layoff","recall"];
const MATERIAL=["earnings","guidance","contract","offering","merger","acquisition","approval","fda","sec","investigation","lawsuit","partnership","buyback","restructur","ceo","cfo"];
function scoreText(s:string){const x=s.toLowerCase();let n=0;for(const k of POS)if(x.includes(k))n++;for(const k of NEG)if(x.includes(k))n--;return n}
function materiality(s:string){const x=s.toLowerCase();return MATERIAL.some(k=>x.includes(k))?"High":"Normal"}
async function get(url:string){const c=new AbortController(),t=setTimeout(()=>c.abort(),4200);try{const r=await fetch(url,{next:{revalidate:900},signal:c.signal});if(!r.ok)return null;return await r.json()}catch{return null}finally{clearTimeout(t)}}
function ymd(d:Date){return d.toISOString().slice(0,10)}
export async function GET(_:Request,{params}:{params:Promise<{symbol:string}>}){const{symbol:raw}=await params;const symbol=decodeURIComponent(raw).toUpperCase(),key=process.env.FINNHUB_API_KEY;if(!key)return NextResponse.json({enabled:false,source:"Finnhub",news:[],earnings:null,surprises:[],recommendations:[],profile:null,summary:{tone:"neutral",label:"News feed not connected",topReason:"Add a free Finnhub API key for live company news and earnings context."}});
 if(symbol.includes("/"))return NextResponse.json({enabled:true,source:"Finnhub",news:[],earnings:null,surprises:[],recommendations:[],profile:null,summary:{tone:"neutral",label:"Crypto news connector not enabled",topReason:"This build uses the market-data engine for crypto; a crypto-specific news/on-chain source can be added later."}});
 const now=new Date(),from=new Date(Date.now()-14*86400000),future=new Date(Date.now()+90*86400000);
 const base="https://finnhub.io/api/v1";
 const [news,calendar,surprises,recs,profile]=await Promise.all([
  get(`${base}/company-news?symbol=${encodeURIComponent(symbol)}&from=${ymd(from)}&to=${ymd(now)}&token=${key}`),
  get(`${base}/calendar/earnings?symbol=${encodeURIComponent(symbol)}&from=${ymd(now)}&to=${ymd(future)}&token=${key}`),
  get(`${base}/stock/earnings?symbol=${encodeURIComponent(symbol)}&limit=4&token=${key}`),
  get(`${base}/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${key}`),
  get(`${base}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key}`)
 ]);
 const items=(Array.isArray(news)?news:[]).slice(0,20).map((x:any)=>{const text=`${x.headline||""} ${x.summary||""}`,sc=scoreText(text);return{headline:x.headline,summary:x.summary,url:x.url,date:x.datetime?new Date(x.datetime*1000).toISOString():null,source:x.source,tone:sc>0?"positive":sc<0?"negative":"neutral",materiality:materiality(text),score:sc}}).sort((a:any,b:any)=>(b.materiality==="High"?1:0)-(a.materiality==="High"?1:0)||Math.abs(b.score)-Math.abs(a.score));
 const positive=items.filter((x:any)=>x.tone==="positive").length,negative=items.filter((x:any)=>x.tone==="negative").length;
 const tone=negative>positive+1?"negative":positive>negative+1?"positive":"neutral";
 const nextEarnings=(calendar?.earningsCalendar||[]).filter((x:any)=>x.date>=ymd(now)).sort((a:any,b:any)=>String(a.date).localeCompare(String(b.date)))[0]||null;
 const top=items[0];
 const latestEarningsNews=items.filter((x:any)=>/(earnings|results|quarter|fiscal year|financial results)/i.test(`${x.headline||""} ${x.summary||""}`)).sort((a:any,b:any)=>String(b.date||"").localeCompare(String(a.date||"")))[0]||null;
 const summary={tone,label:tone==="positive"?"News tone supportive":tone==="negative"?"News tone cautious":"News tone mixed",topReason:top?`${top.materiality==="High"?"Material: ":""}${top.headline}`:"No material headline was found in the recent feed."};
 return NextResponse.json({enabled:true,source:"Finnhub",news:items.slice(0,10),earnings:nextEarnings,latestEarningsNews,surprises:Array.isArray(surprises)?surprises.slice(0,4):[],recommendations:Array.isArray(recs)?recs.slice(0,4):[],profile:profile||null,summary});
}
