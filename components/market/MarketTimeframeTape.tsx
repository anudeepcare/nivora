const TF=['15M','1H','4H','1D','1W'] as const;
const prettyRating=(x:any)=>String(x||'—').replaceAll('_',' ');
const tone=(x:any)=>{const s=String(x||'').toUpperCase();return s==='BUY'?'good':s==='SELL'?'bad':'mid'};
function stateFor(mi:any,tf:string){
 const projected=mi?.timeframes?.[tf];
 if(projected)return{confirmed:projected.confirmed??null,live:projected.livePreview??null};
 return{confirmed:mi?.confirmed?.[tf]?.rating??null,live:mi?.livePreview?.[tf]?.rating??null};
}
export default function MarketTimeframeTape({marketIntelligence,compact=false}:{marketIntelligence:any;compact?:boolean}){
 if(!marketIntelligence)return null;
 return <div className={`v934TimeframeTape ${compact?'compact':''}`} data-market-intelligence-snapshot={marketIntelligence.snapshotId||''} aria-label="Multi-timeframe market state">
  {TF.map(tf=>{const s=stateFor(marketIntelligence,tf);const diverges=s.live&&s.confirmed&&s.live!==s.confirmed;return <span key={tf}>
   <small>{tf}</small><b className={tone(s.confirmed)}>{prettyRating(s.confirmed)}</b>{diverges?<em className={tone(s.live)}>LIVE {prettyRating(s.live)}</em>:null}
  </span>})}
 </div>;
}
