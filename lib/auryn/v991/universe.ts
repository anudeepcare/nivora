export type UniverseRow={symbol:string;sector?:string|null;asset_type?:string|null;type?:string|null;name?:string|null;priority?:number|null};
const derivative=/(\.WT$|\.WS$|\/WS$|\.UN$|\/U$|\.RT$|\/R$|\^[A-Z0-9]+$)/i;
export function isValidationEligibleSymbol(symbolRaw:string){
 const s=String(symbolRaw||"").trim().toUpperCase();
 if(!s||s.includes("/")&&!["BTC/USD","ETH/USD"].includes(s))return false;
 if(derivative.test(s))return false;
 return /^[A-Z][A-Z0-9.-]{0,9}$/.test(s);
}
function hash(s:string){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h}
export function buildStratifiedUniverse(rows:UniverseRow[],limit=300){
 const clean=rows.filter(r=>isValidationEligibleSymbol(r.symbol));
 const groups=new Map<string,UniverseRow[]>();
 for(const r of clean){const k=String(r.sector||"UNCLASSIFIED").trim().toUpperCase()||"UNCLASSIFIED";const a=groups.get(k)||[];a.push(r);groups.set(k,a)}
 for(const a of groups.values())a.sort((x,y)=>(Number(x.priority??100)-Number(y.priority??100))||(hash(x.symbol)-hash(y.symbol)));
 const keys=[...groups.keys()].sort((a,b)=>hash(a)-hash(b)),out:string[]=[];let progressed=true;
 while(out.length<limit&&progressed){progressed=false;for(const k of keys){const x=groups.get(k)?.shift();if(x){out.push(x.symbol.toUpperCase());progressed=true;if(out.length>=limit)break}}}
 return out;
}
