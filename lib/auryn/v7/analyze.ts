import type {AurynV6Analysis} from '../v6/domain';
import type {AurynV7Analysis} from './domain';
import {AURYN_V7_ENGINE_VERSION} from './version';
import {auditCanonicalTrust} from './trust-audit';

export function buildAurynV7Analysis({v6}:{v6:AurynV6Analysis}):AurynV7Analysis{
  const v5=v6.v5;
  const valuation=v5.metrics.find(m=>m.id==='valuation');
  const trust=auditCanonicalTrust({
    snapshotId:v5.snapshotId,
    marketTruth:{snapshotId:v5.marketTruth.snapshotId,decisionPrice:v5.marketTruth.decisionPrice,priceSensitiveAllowed:v5.marketTruth.priceSensitiveAllowed},
    executionPlan:v5.executionPlan,
    scenario:v5.scenario,
    valuationAvailable:Boolean(valuation?.available),
    primaryAction:v5.decision.primaryAction,
  });
  return{version:'auryn-v7',engineVersion:AURYN_V7_ENGINE_VERSION,snapshotId:v5.snapshotId,symbol:v5.symbol,asOf:v5.asOf,v6,trust};
}
