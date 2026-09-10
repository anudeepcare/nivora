import type {AurynMarketIntelligenceSnapshot,AurynTimeframe} from './domain';

const TIMEFRAMES:AurynTimeframe[]=['15M','1H','4H','1D','1W'];

export function projectMarketIntelligence(snapshot:AurynMarketIntelligenceSnapshot|null|undefined){
  if(!snapshot)return null;
  const timeframes=Object.fromEntries(TIMEFRAMES.map(tf=>{
    const confirmed=snapshot.confirmed?.[tf]??null;
    const live=snapshot.livePreview?.[tf]??null;
    return [tf,{
      confirmed:confirmed?.rating??null,
      confirmedScore:confirmed?.score??null,
      confirmedAsOf:confirmed?.asOf??null,
      livePreview:live?.rating??null,
      liveScore:live?.score??null,
      liveAsOf:live?.asOf??null
    }];
  }));
  const map=snapshot.actionMap??null;
  const levels=map?{
    preferredEntryLow:map.preferredEntry?.low??null,
    preferredEntryHigh:map.preferredEntry?.high??null,
    confirm:map.confirm??null,
    support:map.support??null,
    majorSupport:map.majorSupport??null,
    invalidation:map.invalidation??null,
    t1:map.t1??null,
    t2:map.t2??null,
    asOf:map.asOf??null
  }:null;
  return{
    version:snapshot.version,
    snapshotId:snapshot.snapshotId,
    marketTruthSnapshotId:snapshot.marketTruthSnapshotId,
    fingerprint:snapshot.fingerprint,
    asOf:snapshot.asOf,
    session:snapshot.session,
    calendarState:snapshot.calendarState,
    priceState:snapshot.priceState,
    priceUse:snapshot.priceUse,
    displayPrice:snapshot.displayPrice,
    decisionPrice:snapshot.decisionPrice,
    alignment:snapshot.summary?.alignment??null,
    primaryTimeframe:snapshot.summary?.primaryTimeframe??null,
    researchActive:Boolean(snapshot.summary?.researchActive),
    timeframes,
    levels,
    actionMap:map,
    coverage:snapshot.coverage
  };
}
