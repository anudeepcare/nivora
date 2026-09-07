import type {ProfessionalMetric} from './domain';

const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const fixed=(n:number,d:number)=>{
  const s=n.toFixed(d);
  return d===0?s:s.replace(/(\.\d*?[1-9])0+$|\.0+$/,'$1');
};

export function formatScoreValue(value:number|null|undefined){
  return finite(value)?`${Math.round(value)}/100`:'N/A';
}


export function formatScoreBand(value:number|null|undefined){
  if(!finite(value))return 'N/A';
  return value>=75?'Strong':value>=60?'Good':value>=45?'Mixed':value>=30?'Weak':'Poor';
}

export function formatRiskBand(value:number|null|undefined){
  if(!finite(value))return 'N/A';
  return value<=35?'Low':value<=55?'Moderate':value<=74?'Elevated':'High';
}

export function formatProfessionalMetricValue(metric:ProfessionalMetric):string{
  if(!metric.available||metric.value==null)return 'N/A';
  if(typeof metric.value==='string')return metric.value;
  const value=metric.value;
  const id=metric.id;
  if(id==='ichimokuPosition')return value>0?'Above cloud':value<0?'Below cloud':'Inside cloud';
  if(metric.unit==='/100')return formatScoreValue(value);
  if(metric.unit==='x')return `${fixed(value,2)}×`;
  if(metric.unit==='%')return `${fixed(value,1)}%`;
  if(metric.unit==='$')return `$${fixed(value,2)}`;
  if(id==='cmf20')return fixed(value,3);
  if(id==='macdHistogram')return fixed(value,3);
  if(['rsi14','adx14','dmiSpread','stochasticK','cci20','mfi14','roc20','bollingerWidth','donchianPosition','vwap20Distance','anchoredVwapDistance','volumeProfilePocDistance','keltnerPosition'].includes(id))return fixed(value,1);
  if(['obvSlope','volumeDryUp'].includes(id))return fixed(value,2);
  return fixed(value,2);
}
