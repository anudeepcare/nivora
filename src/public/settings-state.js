export const SETTINGS_KEY='auryn.settings.v1';
export const defaultSettings=Object.freeze({
  experience:'glance',theme:'night',accent:'indigo',largeType:true,
  signals:{congress:true,insiders:true,institutions:true,options:true,technicals:true},
  alerts:{thesis:'Immediate',pace:'Immediate',earnings:'7 days before',filings:'Daily digest',estimates:'Daily digest'},
  policy:{maxPosition:8,maxLoss:1,cashReserve:10}
});
const experiences=new Set(['glance','deep','swing']),themes=new Set(['daylight','night']),accents=new Set(['indigo','teal','orange']);
const alertValues={thesis:new Set(['Immediate','Daily digest','Off']),pace:new Set(['Immediate','Daily digest','Off']),earnings:new Set(['1 day before','3 days before','7 days before','14 days before','Off']),filings:new Set(['Immediate','Daily digest','Off']),estimates:new Set(['Immediate','Daily digest','Off'])};
const bounded=(value,min,max,fallback)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max?value:fallback;
export function normalizeSettings(value={}){const signals={...defaultSettings.signals};for(const k of Object.keys(signals))if(typeof value.signals?.[k]==='boolean')signals[k]=value.signals[k];const alerts={...defaultSettings.alerts};for(const k of Object.keys(alerts))if(alertValues[k].has(value.alerts?.[k]))alerts[k]=value.alerts[k];const policy={maxPosition:bounded(value.policy?.maxPosition,1,100,defaultSettings.policy.maxPosition),maxLoss:bounded(value.policy?.maxLoss,.1,20,defaultSettings.policy.maxLoss),cashReserve:bounded(value.policy?.cashReserve,0,100,defaultSettings.policy.cashReserve)};return {...defaultSettings,experience:experiences.has(value.experience)?value.experience:defaultSettings.experience,theme:themes.has(value.theme)?value.theme:defaultSettings.theme,accent:accents.has(value.accent)?value.accent:defaultSettings.accent,largeType:typeof value.largeType==='boolean'?value.largeType:defaultSettings.largeType,signals,alerts,policy}}
export function readSettings(storage){try{return normalizeSettings(JSON.parse(storage.getItem(SETTINGS_KEY)||'{}'))}catch{return normalizeSettings()}}
export function saveSettings(storage,value){const normalized=normalizeSettings(value);storage.setItem(SETTINGS_KEY,JSON.stringify(normalized));return normalized}
export function intelligenceSignalsMatch(intelligence,settings){
  const actual=intelligence?.controls?.signals,expected=normalizeSettings(settings).signals;
  return Boolean(actual)&&['institutions','insiders','congress','options'].every(key=>actual[key]===expected[key]);
}
export function resolveResearchTab(requested,settings){
  const value=normalizeSettings(settings),known=new Set(['atlas','scenarios','technicals','ownership','events','indicators','pace','options']);
  const fallback=value.experience==='swing'&&value.signals.technicals?'technicals':'atlas';
  const tab=known.has(requested)?requested:fallback;
  if(['technicals','indicators'].includes(tab)&&!value.signals.technicals)return'atlas';
  if(tab==='ownership'&&!value.signals.institutions&&!value.signals.insiders&&!value.signals.congress)return'atlas';
  if(tab==='options'&&!value.signals.options)return'atlas';
  return tab;
}
