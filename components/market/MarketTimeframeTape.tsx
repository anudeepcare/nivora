const TF=['15M','1H','4H','1D','1W'] as const;
const prettyRating=(x:any)=>String(x||'Unavailable').replaceAll('_',' ');
const tone=(x:any)=>{const s=String(x||'').toUpperCase();return s==='BUY'?'good':s==='SELL'?'bad':'mid'};
function stateFor(mi:any,tf:string){
 const projected=mi?.timeframes?.[tf];
 if(projected)return{confirmed:projected.confirmed??null,live:projected.livePreview??null};
 return{confirmed:mi?.confirmed?.[tf]?.rating??null,live:mi?.livePreview?.[tf]?.rating??null};
}
function unavailableReason(mi:any,tf:string){
 const provided=mi?.coverage?.reasons?.[tf]??mi?.timeframes?.[tf]?.unavailableReason;
 return typeof provided==='string'&&provided.trim()?provided:`No verified ${tf} study is present in this snapshot. At least 40 completed ${tf} bars are required; the provider cause is not supplied.`;
}
export default function MarketTimeframeTape({marketIntelligence,compact=false}:{marketIntelligence:any;compact?:boolean}){
 const missing=TF.filter(tf=>!stateFor(marketIntelligence,tf).confirmed);
 return <><div className={`v934TimeframeTape ${styles.timeframeTape} ${compact?'compact':''}`} data-market-intelligence-snapshot={marketIntelligence?.snapshotId||''} aria-label="Multi-timeframe market state">
  {TF.map(tf=>{const s=stateFor(marketIntelligence,tf);const diverges=s.live&&s.confirmed&&s.live!==s.confirmed;return <span key={tf}>
   <small>{tf}</small><b className={tone(s.confirmed)}>{prettyRating(s.confirmed)}</b>{diverges?<em className={tone(s.live)}>LIVE {prettyRating(s.live)}</em>:null}
  </span>})}
 </div>{!compact&&<details className="weeklyDetails"><summary>Timeframe coverage & limitations</summary><div className="weeklyMethod">{missing.map(tf=><p key={tf}><b>{tf} · Unavailable:</b> {unavailableReason(marketIntelligence,tf)}</p>)}{!missing.length&&<p>All requested timeframes have a confirmed study in this snapshot.</p>}<p>Technical ratings describe price evidence and are not an investment instruction. A live preview is unconfirmed and does not replace completed-bar evidence. Action levels have separate price-verification and policy requirements.</p></div></details>}</>;
}
import styles from '../research/TechnicalStudies.module.css';
