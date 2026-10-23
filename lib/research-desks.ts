import type { Research } from "./types";
import { professionalStudies } from "./professional-studies.ts";
import { advancedStudies } from "./advanced-research.ts";
export type DeskMetric = {key:string;label:string;value:number|null;unit:"ratio"|"percent"|"money"|"sessions";note:string};
const positive = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
export function valueDesk(r: Research) {
  if (r.company.assetType === "crypto") return {asOf:null,metrics:[] as DeskMetric[]};
  const m=r.evidence?.multiples ?? {}, h=r.evidence?.highlights ?? {};
  const trailing=positive(m.TrailingPE), forward=positive(m.ForwardPE);
  const metrics:DeskMetric[] = [
    {key:"trailingPE",label:"Trailing P/E",value:trailing,unit:"ratio",note:"Quoted equity price relative to reported trailing earnings."},
    {key:"forwardPE",label:"Forward P/E",value:forward,unit:"ratio",note:"Price relative to estimated earnings; forecasts can change."},
    {key:"earningsYield",label:"Trailing earnings yield",value:trailing?100/trailing:null,unit:"percent",note:"Inverse trailing P/E. Accounting earnings, not cash paid to you."},
    {key:"forwardYield",label:"Forward earnings yield",value:forward?100/forward:null,unit:"percent",note:"Inverse forward P/E. An estimate, not an expected return."},
    {key:"evRevenue",label:"EV / revenue",value:positive(m.EnterpriseValueRevenue),unit:"ratio",note:"Reported enterprise value per unit of revenue; capital structure matters."},
    {key:"evEbitda",label:"EV / EBITDA",value:positive(m.EnterpriseValueEbitda),unit:"ratio",note:"Reported enterprise value relative to EBITDA, before capex and financing costs."},
    {key:"priceSales",label:"Price / sales",value:positive(m.PriceSalesTTM),unit:"ratio",note:"Reported equity value relative to sales; does not account for margins."},
    {key:"priceBook",label:"Price / book",value:positive(m.PriceBookMRQ),unit:"ratio",note:"Reported equity price relative to book equity; usefulness varies by business."},
    {key:"dividendYield",label:"Dividend yield",value:positive(h.DividendYield)!=null?h.DividendYield!*100:null,unit:"percent",note:"Reported distribution yield. Future dividends are not guaranteed."},
  ];
  return {asOf:r.evidence?.updatedAt??null,metrics};
}
export function advancedDesk(r:Research) {
  const annual=r.company.assetType === "crypto"?365:252;
  const s=professionalStudies(r.history,r.retrievedAt,annual),a=advancedStudies(r.history,r.retrievedAt);
  const bars=[...new Map(r.history.filter(b=>/^\d{4}-\d{2}-\d{2}$/.test(b.time)&&b.time<r.retrievedAt.slice(0,10)&&[b.open,b.high,b.low,b.close].every(Number.isFinite)&&b.low>0&&b.high>=Math.max(b.open,b.close,b.low)&&b.low<=Math.min(b.open,b.close)).map(b=>[b.time,b])).values()].sort((x,y)=>x.time.localeCompare(y.time));
  let peak=0;const drawdown=bars.map(b=>{peak=Math.max(peak,b.close);return {date:b.time,value:(b.close/peak-1)*100}}).slice(-annual);
  const returns=bars.slice(1).map((b,i)=>(b.close/bars[i].close-1)*100);
  const bounds=[-Infinity,-5,-2,0,2,5,Infinity],labels=["Below −5%","−5% to −2%","−2% to 0%","0% to +2%","+2% to +5%","+5% and above"];
  const distribution=labels.map((label,i)=>({label,count:returns.filter(x=>x>=bounds[i]&&x<bounds[i+1]).length,negative:i<3}));
  const metrics:DeskMetric[]=[
    {key:"atr",label:"Typical daily range",value:a.atrPct,unit:"percent",note:"14-session average true range / last completed close."},
    {key:"vol30",label:"Realized volatility · 30",value:s.vol30,unit:"percent",note:"30 log-return sample deviation, annualized."},
    {key:"es95",label:"Average worst 5% of days",value:s.es95,unit:"percent",note:"Historical daily expected shortfall. Not a future loss limit."},
    {key:"liquidity",label:"Typical daily traded value",value:a.averageDollarVolume,unit:"money",note:"Prior 20 sessions, close × volume. Share volume must be supplied."},
    {key:"gap",label:"Largest opening gap",value:a.largestGap,unit:"percent",note:"Absolute open versus previous close in supplied history."},
    {key:"recovery",label:"Rise needed to regain peak",value:s.currentDrawdown!=null&&s.currentDrawdown>-100?100/(1+s.currentDrawdown/100)-100:null,unit:"percent",note:"Arithmetic recovery to the highest supplied close; not a forecast."},
    {key:"underwater",label:"Sessions below peak",value:s.drawdownSessions,unit:"sessions",note:"Observed sessions since the highest supplied closing price."},
    {key:"var99",label:"Historical daily VaR · 99%",value:s.var99,unit:"percent",note:"Sample 1st-percentile loss; at least 250 returns required."},
    {key:"gapFrequency",label:"Gaps larger than 3%",value:s.gapFrequency,unit:"percent",note:"Share of supplied opening gaps whose absolute size exceeds 3%."},
    {key:"up60",label:"Positive sessions · 60",value:s.upPct60,unit:"percent",note:"Share of the last 60 close-to-close returns above zero."},
    {key:"momentum20",label:"20-session change",value:a.roc20,unit:"percent",note:"Completed close versus 20 observations earlier."},
    {key:"momentum60",label:"60-session change",value:a.roc60,unit:"percent",note:"Completed close versus 60 observations earlier."},
  ];
  return {asOf:a.asOf,count:bars.length,metrics,drawdown,distribution,returnCount:returns.length,volatility:[{label:"10 sessions",value:s.vol10},{label:"30 sessions",value:s.vol30},{label:"90 sessions",value:s.vol90}],currentDrawdown:s.currentDrawdown};
}
