const usable=x=>['live','preview'].includes(x?.status);

const forSymbol=(envelope,expected,{validatePayloadTicker=false}={})=>{
  const payloadTicker=validatePayloadTicker&&typeof envelope.data?.ticker==='string'?envelope.data.ticker.toUpperCase():null;
  if(usable(envelope)&&payloadTicker&&payloadTicker!==expected.toUpperCase())return{...envelope,status:'subject-mismatch',data:null,reason:`Provider payload is for ${payloadTicker}, not ${expected}.`};
  if(envelope?.status!=='preview')return envelope;
  const sample=typeof envelope.sampleCompany==='string'?envelope.sampleCompany.toUpperCase():null;
  if(sample&&sample!==expected.toUpperCase())return{...envelope,status:'preview-mismatch',data:null,reason:`Preview sample is for ${sample}, not ${expected}.`};
  if(sample)return envelope;
  return{...envelope,status:'preview-mismatch',data:null,reason:`Preview sample is for an unverified company, not ${expected}.`};
};

const categorized=(envelope,category)=>({envelope,category});
const section=(...inputs)=>{
  const items=inputs.map(input=>input?.envelope??input);
  const accepted=items.filter(usable),preview=accepted.some(x=>x.status==='preview'),previewOnly=accepted.length>0&&accepted.every(x=>x.status==='preview');
  const intentionallyDisabled=items.length>0&&items.every(x=>x?.status==='disabled');
  return{
    status:accepted.length?'available':intentionallyDisabled?'disabled':'unavailable',
    access:intentionallyDisabled?'disabled':previewOnly?'preview':preview?'contains-preview':'live',
    preview,
    data:accepted.length?inputs.map(input=>{const x=input?.envelope??input;return{source:x.status==='preview'?`${x.source} · PREVIEW SAMPLE`:x.source,status:x.status,category:input?.category??null,data:usable(x)?x.data??null:null,asOf:x.asOf??null,sampleCompany:x.sampleCompany??null}}):null,
    provenance:inputs.map(input=>{const x=input?.envelope??input;return{source:x?.source??'unknown',status:x?.status??'error',category:input?.category??null,asOf:x?.asOf??null,reason:x?.reason??null,sampleCompany:x?.sampleCompany??null}}),
  };
};

export async function loadResearchIntelligence(symbol,{senti,eod},requested={},clock={}){
  if(typeof symbol!=='string'||!/^[A-Z0-9._-]{1,20}$/i.test(symbol))return{status:'invalid-request',symbol:null,sections:{},reason:'A valid ticker symbol is required.'};
  const s=symbol.toUpperCase();
  const providerSymbols=requested.providerSymbols??{};
  const sentiSymbol=Object.hasOwn(providerSymbols,'sentisense')?providerSymbols.sentisense:s;
  const eodSymbol=providerSymbols.eodhd??s;
  const newsDays=[7,30,90].includes(Number(requested.newsDays))?Number(requested.newsDays):7;
  const ownershipDays=[90,180,365].includes(Number(requested.ownershipDays))?Number(requested.ownershipDays):90;
  const signals={institutions:requested.signals?.institutions!==false,insiders:requested.signals?.insiders!==false,congress:requested.signals?.congress!==false,options:requested.signals?.options!==false};
  const asOf=clock.asOf instanceof Date&&Number.isFinite(clock.asOf.getTime())?clock.asOf:new Date();
  const from=days=>new Date(asOf.getTime()-days*864e5).toISOString().slice(0,10);
  const calendarFrom=asOf.toISOString().slice(0,10),calendarTo=new Date(asOf.getTime()+90*864e5).toISOString().slice(0,10);
  const unsupported={status:'unsupported-market',source:'SentiSense Pro',data:null,reason:'No verified provider identity exists for this market.'};
  const disabled=label=>({status:'disabled',source:label,data:null,reason:'Disabled by the user Data & Signals preference.'});
  const sentiCall=fn=>sentiSymbol===null?Promise.resolve(unsupported):fn();
  let[documents,eodNews,earnings,upcomingEarnings,holders,insiders,form4,politicians,options,dividends]=await Promise.all([
    sentiCall(()=>senti.documents(sentiSymbol,{source:'NEWS',days:newsDays,limit:25})),
    eod.news(eodSymbol,{limit:25,from:from(newsDays)}),
    sentiCall(()=>senti.earnings(sentiSymbol,{limit:4})),
    typeof eod.earnings==='function'?eod.earnings({symbols:eodSymbol,from:calendarFrom,to:calendarTo}):Promise.resolve({status:'unavailable',source:'EODHD',data:null,reason:'Upcoming earnings calendar is unavailable.'}),
    signals.institutions?sentiCall(()=>senti.institutionalHolders(sentiSymbol)):disabled('SentiSense Pro institutions'),
    signals.insiders?sentiCall(()=>senti.insiders(sentiSymbol,{lookbackDays:ownershipDays})):disabled('SentiSense Pro insiders'),
    signals.insiders?eod.insiderTransactions(eodSymbol,{limit:50,from:from(ownershipDays)}):disabled('EODHD insiders'),
    signals.congress?sentiCall(()=>senti.politicians(sentiSymbol,{lookbackDays:ownershipDays})):disabled('SentiSense Pro congress'),
    signals.options?sentiCall(()=>senti.optionsSummary(sentiSymbol)):disabled('SentiSense Pro options'),
    eod.dividends(eodSymbol,{from:from(366)}),
  ]);
  if(sentiSymbol!==null){documents=forSymbol(documents,sentiSymbol);earnings=forSymbol(earnings,sentiSymbol,{validatePayloadTicker:true});holders=forSymbol(holders,sentiSymbol,{validatePayloadTicker:true});insiders=forSymbol(insiders,sentiSymbol,{validatePayloadTicker:true});politicians=forSymbol(politicians,sentiSymbol,{validatePayloadTicker:true});options=forSymbol(options,sentiSymbol,{validatePayloadTicker:true})}
  const sections={news:section(documents,eodNews),earnings:section(earnings),upcomingEarnings:section(upcomingEarnings),ownership:section(categorized(holders,'institutional'),categorized(insiders,'insider'),categorized(form4,'insider')),publicOfficials:section(categorized(politicians,'congress')),options:section(options),income:section(dividends)};
  const available=Object.values(sections).some(x=>x.status==='available'),preview=Object.values(sections).some(x=>x.preview);
  return{status:available?'available':'unavailable',access:preview?'contains-preview':'live-or-unavailable',symbol:s,controls:{newsDays,ownershipDays,signals},coverage:{news:{sentisenseDays:newsDays,eodhdFrom:from(newsDays)},ownership:{sentisenseDays:ownershipDays,eodhdFrom:from(ownershipDays)},upcomingEarnings:{from:calendarFrom,to:calendarTo,symbol:eodSymbol}},sections,note:'Each section is a fixed server-owned workflow. Preview records are labeled and mismatched sample companies are rejected. Disabled signals make zero provider calls. Upcoming earnings use a fixed 90-day company window. No arbitrary provider endpoint execution is exposed.'};
}
