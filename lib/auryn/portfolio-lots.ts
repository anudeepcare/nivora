export type PortfolioLot={id:string;symbol:string;account_name?:string|null;shares:number;avg_cost:number;asset_type?:string;currency?:string|null;[k:string]:any};
export function aggregatePortfolioLots(rows:PortfolioLot[]){
 const groups=new Map<string,PortfolioLot[]>();
 for(const row of rows){const key=`${String(row.asset_type||"EQUITY").toUpperCase()}:${String(row.symbol||"").toUpperCase()}`;(groups.get(key)||groups.set(key,[]).get(key)!).push(row)}
 return[...groups.values()].map(lots=>{
  const first=lots[0],shares=lots.reduce((a,x)=>a+Number(x.shares||0),0),cost=lots.reduce((a,x)=>a+Number(x.shares||0)*Number(x.avg_cost||0),0);
  return{...first,symbol:String(first.symbol).toUpperCase(),shares,avg_cost:shares>0?cost/shares:0,account_name:lots.length===1?(first.account_name||"Default"):"Multiple",accountLots:lots.map(x=>({...x,account_name:x.account_name||"Default"}))};
 });
}
