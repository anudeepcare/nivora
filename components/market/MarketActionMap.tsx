import {formatMoney} from '@/lib/nivora-format';
const money=(x:any)=>Number.isFinite(Number(x))?formatMoney(Number(x)):'—';
function resolve(mi:any){
 const map=mi?.actionMap??null,levels=mi?.levels??null;
 return{
  entryLow:map?.preferredEntry?.low??levels?.preferredEntryLow??null,
  entryHigh:map?.preferredEntry?.high??levels?.preferredEntryHigh??null,
  confirm:map?.confirm??levels?.confirm??null,
  support:map?.support??levels?.support??null,
  majorSupport:map?.majorSupport??levels?.majorSupport??null,
  t1:map?.t1??levels?.t1??null,
  t2:map?.t2??levels?.t2??null,
  invalidation:map?.invalidation??levels?.invalidation??null
 };
}
export default function MarketActionMap({marketIntelligence}:{marketIntelligence:any}){
 if(!marketIntelligence)return null;const x=resolve(marketIntelligence);const entry=Number.isFinite(Number(x.entryLow))&&Number.isFinite(Number(x.entryHigh))?`${money(x.entryLow)}–${money(x.entryHigh)}`:'—';
 return <div className="v934ActionMap" data-market-intelligence-snapshot={marketIntelligence.snapshotId||''} aria-label="Canonical market action map">
  <span><small>PREFERRED ENTRY</small><b>{entry}</b></span>
  <span><small>CONFIRM</small><b>{money(x.confirm)}</b></span>
  <span><small>SUPPORT</small><b>{money(x.support)}</b></span>
  <span><small>MAJOR SUPPORT</small><b>{money(x.majorSupport)}</b></span>
  <span><small>T1</small><b>{money(x.t1)}</b></span>
  <span><small>T2</small><b>{money(x.t2)}</b></span>
  <span className="risk"><small>RISK / INVALIDATION</small><b>{money(x.invalidation)}</b></span>
 </div>;
}
