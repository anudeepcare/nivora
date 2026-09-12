type Row={symbol:string;marketPrice:number;baseValue:number};
export function auditValuationAnchoring(rows:Row[]){
 const valid=rows.filter(r=>Number.isFinite(r.marketPrice)&&r.marketPrice>0&&Number.isFinite(r.baseValue)&&r.baseValue>0);
 const band=(pct:number)=>{const symbols=valid.filter(r=>Math.abs(r.baseValue/r.marketPrice-1)<=pct/100).map(r=>r.symbol);return{count:symbols.length,sharePct:valid.length?Math.round(symbols.length/valid.length*1000)/10:0,symbols}};
 const within2Pct=band(2),within5Pct=band(5),within10Pct=band(10);
 // Calibration warning only; never mutate valuation outputs to satisfy this gate.
 const flag=valid.length>=20&&within5Pct.sharePct>=70?"FAIL":valid.length>=20&&within5Pct.sharePct>=50?"WATCH":"OK";
 return{sampleSize:valid.length,within2Pct,within5Pct,within10Pct,flag,reason:flag==="FAIL"?"Independent Base values are suspiciously clustered around market price; investigate valuation construction.":"No severe anchoring concentration detected in this sample."};
}
