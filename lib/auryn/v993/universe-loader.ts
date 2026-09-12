export const validationUniverseColumns="symbol,sector,asset_type,name,priority";
export function validationUniversePageRanges(total=6000,pageSize=1000){
 const out:Array<[number,number]>=[];for(let from=0;from<total;from+=pageSize)out.push([from,Math.min(total-1,from+pageSize-1)]);return out;
}
export async function loadValidationUniversePages(client:any,total=6000,pageSize=1000){
 const rows:any[]=[];
 for(const [from,to] of validationUniversePageRanges(total,pageSize)){
  const {data,error}=await client.from("nivora_market_universe").select(validationUniverseColumns).eq("active",true).range(from,to);
  if(error)throw new Error(error.message);
  const page=data||[];rows.push(...page);
  if(page.length<(to-from+1))break;
 }
 return rows;
}
