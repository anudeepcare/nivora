import type {TechnicalSnapshot} from '../../nivora-technical-engine';
import type {PatternSignal,ScenarioMap} from './domain';
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const confidence=(n:number):'HIGH'|'MEDIUM'|'LOW'=>n>=75?'HIGH':n>=55?'MEDIUM':'LOW';
export function buildScenarioMap({technical,patterns}:{technical:TechnicalSnapshot|null;patterns:PatternSignal[]}):ScenarioMap|null{
  if(!technical)return null;
  const top=patterns[0]; const c=clamp(Math.round(technical.scores.trend*.22+technical.scores.momentum*.22+technical.scores.flow*.16+technical.scores.structure*.2+(100-technical.scores.risk)*.1+(top?.score??50)*.1));
  const support=technical.levels.support,major=technical.levels.majorSupport,res=technical.levels.resistance,breakout=technical.levels.breakout,inv=technical.levels.invalidation;
  const waveLabel=technical.scores.trend>=65&&technical.scores.momentum>=65?'Impulsive advance candidate':technical.scores.trend<40&&technical.scores.momentum<45?'Corrective decline candidate':'Mixed / corrective structure';
  return{
    structure:technical.scores.trend>=65?'Uptrend / constructive':technical.scores.trend<40?'Downtrend / damaged':'Transition / mixed trend',
    setup:top?.type.replaceAll('_',' ')||'No dominant setup',confluenceScore:c,
    waveContext:{label:waveLabel,confidence:confidence(Math.min(c,70)),note:'Probabilistic supporting structure only; wave interpretation never determines the decision by itself.'},
    bull:{label:'BULL',summary:'Bull case requires structural confirmation and participation.',trigger:res,zoneLow:support,zoneHigh:res,targetLow:breakout,targetHigh:breakout+technical.volatility.atr14*2,invalidation:major,confidence:confidence(c)},
    base:{label:'BASE',summary:'Base case is consolidation between support and resistance while the thesis remains intact.',trigger:null,zoneLow:major,zoneHigh:res,targetLow:support,targetHigh:res,invalidation:inv,confidence:confidence(55+technical.scores.structure*.25)},
    bear:{label:'BEAR',summary:'Bear case activates on a decisive loss of structural invalidation/support.',trigger:inv,zoneLow:inv,zoneHigh:major,targetLow:Math.max(0,inv-technical.volatility.atr14*3),targetHigh:major,invalidation:breakout,confidence:confidence(45+technical.scores.risk*.35)}
  };
}
