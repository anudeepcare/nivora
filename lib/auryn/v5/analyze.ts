import type {CanonicalMarketSnapshot} from '../market-truth';
import type {AurynV4CoreAnalysis} from '../v4/domain';
import type {Bar,TechnicalSnapshot} from '../../nivora-technical-engine';
import type {CanonicalAnalysisSnapshot} from './domain';
import {AURYN_V5_ENGINE_VERSION} from './version';
import {buildProfessionalMetrics} from './metrics';
import {analyzeTechnicalPatterns} from './technical-patterns';
import {buildScenarioMap} from './scenarios';
import {buildExecutionPlan} from './execution-plan';
import {resolveV5CioDecision} from './cio';
export function buildAurynV5Analysis({symbol,marketTruth,v4,technical,bars}:{symbol:string;marketTruth:CanonicalMarketSnapshot;v4:AurynV4CoreAnalysis;technical:TechnicalSnapshot|null;bars:Bar[]}):CanonicalAnalysisSnapshot{
  const metrics=buildProfessionalMetrics({technical,v4,bars});
  const patterns=analyzeTechnicalPatterns(bars,technical);
  const decision=resolveV5CioDecision({v4,technical,marketTruth});
  const vf=v4.factors.VALUATION;
  const valuationDecisionGrade=Boolean(vf&&vf.score!=null&&!(vf.validationState!=='MEASURED'&&/preliminary|not allowed|unsupported|unavailable/i.test(String(vf.reason||''))));
  const executionPlan=buildExecutionPlan({marketTruth,technical,thesis:v4.thesis,riskScore:v4.factors.RISK?.score??null,primaryAction:decision.primaryAction,ownerAction:decision.ownerAction,valuationDecisionGrade});
  const scenario=buildScenarioMap({technical,patterns,executionPlan});
  return{version:'auryn-v5',engineVersion:AURYN_V5_ENGINE_VERSION,snapshotId:marketTruth.snapshotId,symbol:String(symbol).toUpperCase(),asOf:marketTruth.asOf,marketTruth,v4,technical,bars,metrics,patterns,scenario,executionPlan,decision};
}
