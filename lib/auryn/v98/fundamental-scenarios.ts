const finite=(x:number|null|undefined):x is number=>x!=null&&Number.isFinite(x)&&x>0;
const ann=(value:number,price:number|null|undefined,years:number)=>finite(price)?((value/price)**(1/Math.max(.25,years))-1)*100:null;
export type IndependentScenarioInput={bearValue:number|null;baseValue:number|null;bullValue:number|null;horizonYears:number;confidence:number;basis:string;marketPrice?:number|null};
export function buildFundamentalScenarioSpectrum(x:IndependentScenarioInput){
 if(!finite(x.baseValue)||!finite(x.bearValue)||!finite(x.bullValue))return null;
 const mk=(label:"BEAR"|"BASE"|"BULL",value:number)=>({label,value,impliedAnnualReturnPct:ann(value,x.marketPrice,x.horizonYears)});
 return{basis:x.basis,confidence:Math.max(0,Math.min(100,x.confidence)),horizonYears:x.horizonYears,bear:mk("BEAR",x.bearValue),base:mk("BASE",x.baseValue),bull:mk("BULL",x.bullValue),independentOfMarketPrice:true};
}
