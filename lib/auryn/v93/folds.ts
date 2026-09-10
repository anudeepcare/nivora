import type {FeatureObservation,ResearchHorizon} from '../v9/domain';
import type {V93Fold,V93Policy} from './domain';

const dayMs=86400000;
const dateOnly=(value:string)=>String(value||'').slice(0,10);
const time=(value:string)=>Date.parse(`${dateOnly(value)}T00:00:00Z`);

export function createPurgedWalkForwardFolds(rows:FeatureObservation[],horizon:ResearchHorizon,policy:V93Policy):V93Fold[]{
  const ordered=rows.slice().sort((a,b)=>a.asOf.localeCompare(b.asOf)||a.symbol.localeCompare(b.symbol));
  const dates=[...new Set(ordered.map(r=>dateOnly(r.asOf)).filter(Boolean))].sort();
  if(dates.length<policy.foldCount+2)return[];
  const initialCount=Math.max(1,Math.floor(dates.length*policy.initialTrainFraction));
  const remaining=dates.slice(initialCount);
  if(remaining.length<policy.foldCount)return[];
  const purgeMs=(policy.purgeCalendarDays[horizon]??0)*dayMs;
  const folds:V93Fold[]=[];
  for(let i=0;i<policy.foldCount;i++){
    const start=Math.floor(i*remaining.length/policy.foldCount);
    const end=Math.floor((i+1)*remaining.length/policy.foldCount)-1;
    if(end<start)continue;
    const testDates=remaining.slice(start,end+1);
    const testStart=testDates[0],testEnd=testDates[testDates.length-1];
    const trainCut=time(testStart)-purgeMs;
    const trainRows=ordered.filter(r=>time(r.asOf)<trainCut);
    const testSet=new Set(testDates);
    const testRows=ordered.filter(r=>testSet.has(dateOnly(r.asOf)));
    if(!trainRows.length||!testRows.length)continue;
    folds.push({
      index:i,
      trainStart:dateOnly(trainRows[0].asOf),
      trainEnd:dateOnly(trainRows[trainRows.length-1].asOf),
      testStart,
      testEnd,
      trainRows,
      testRows,
    });
  }
  return folds;
}
