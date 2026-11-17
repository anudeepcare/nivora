import{sortIntelligenceRecords}from'./intelligence-view.js';
import{buildOwnershipEvidence}from'./ownership-view.js';
import{normalizeOptionsEvidence}from'./options-view.js';

const statusOf=section=>section?.status==='disabled'?'disabled':section?.status==='available'?'available':section?'unavailable':'not loaded';
const day=value=>{if(typeof value!=='string')return null;const candidate=value.slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(candidate))return null;const parsed=new Date(`${candidate}T00:00:00Z`);return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===candidate?candidate:null};
const previewOf=section=>section?.access==='preview'||section?.preview===true||(section?.data||[]).some(row=>row?.status==='preview'||row?.preview===true||/PREVIEW SAMPLE/i.test(row?.source??''));
const unavailable=(family,section)=>({family,status:statusOf(section),count:0,label:'No eligible records',date:null,source:null,preview:false});
const recordDate=item=>day(item?.date??item?.publishedAt??item?.timestamp??item?.reportDate??item?.disclosureDate??item?.filingDate??item?.filedAt??'');
const latestNode=nodes=>nodes.slice().sort((a,b)=>String(b.filedAt??b.date??b.asOf??'').localeCompare(String(a.filedAt??a.date??a.asOf??'')))[0];

function recordRow(family,section,labelFor){
  if(section?.status!=='available')return unavailable(family,section);const records=sortIntelligenceRecords(section);if(!records.length)return{...unavailable(family,section),status:'unavailable'};const latest=records[0],label=labelFor(latest.item);return{family,status:'available',count:records.length,label:label||`${family} record`,date:latest.date??recordDate(latest.item),source:latest.publisher??latest.source??'Unknown source',preview:previewOf(section)};
}

export function buildAtlasEvidenceLedger(analytics){
  const sections=analytics?.intelligence?.sections||{},ownership=buildOwnershipEvidence({ownership:sections.ownership,publicOfficials:sections.publicOfficials}),owned=ownership.nodes?.filter(node=>node.category!=='congress')??[],officials=ownership.nodes?.filter(node=>node.category==='congress')??[],owner=latestNode(owned),official=latestNode(officials),options=normalizeOptionsEvidence(sections.options);
  const rows=[
    recordRow('News',sections.news,item=>item?.headline??item?.title??item?.name),
    recordRow('Earnings',sections.earnings,item=>{const details=[];if(typeof item?.epsActual==='number'&&Number.isFinite(item.epsActual))details.push(`EPS actual ${item.epsActual}`);if(typeof item?.epsEstimate==='number'&&Number.isFinite(item.epsEstimate))details.push(`EPS estimate ${item.epsEstimate}`);return details.join(' · ')||item?.title||'Earnings record'}),
    owned.length?{family:'Ownership',status:'available',count:owned.length,label:owner.label,date:day(owner.date??owner.asOf??''),source:owner.source,preview:owned.some(node=>node.preview)}:{...unavailable('Ownership',sections.ownership),status:statusOf(sections.ownership)==='available'?'unavailable':statusOf(sections.ownership)},
    officials.length?{family:'Public filings',status:'available',count:officials.length,label:official.label,date:day(official.filedAt??official.date??official.asOf??''),source:official.source,preview:officials.some(node=>node.preview)}:{...unavailable('Public filings',sections.publicOfficials),status:statusOf(sections.publicOfficials)==='available'?'unavailable':statusOf(sections.publicOfficials)},
    options.status==='available'?{family:'Options',status:'available',count:Object.keys(options.metrics).length,label:'Options summary',date:day(options.asOf),source:options.source,preview:options.preview}:{...unavailable('Options',sections.options),status:statusOf(sections.options)==='available'?'unavailable':statusOf(sections.options)}
  ];
  return{status:rows.some(row=>row.status==='available')?'available':'unavailable',rows,note:'Inventory only; no sentiment, direction, weight or composite score is inferred.'};
}

export function renderAtlasEvidenceLedger(value,escape=input=>String(input)){
  return`<section class="atlas-evidence-ledger"><small>SOURCE-LINKED EVIDENCE LEDGER · UNSCORED</small>${value.rows.map(row=>`<div class="evidence-row"><b>${escape(row.family)}</b><span>${escape(row.status)}${row.status==='available'?` · ${row.count} record${row.count===1?'':'s'} · ${escape(row.label)}${row.date?' · '+escape(row.date):''}${row.source?' · '+escape(row.source):''}${row.preview?' · PREVIEW SAMPLE':''}`:''}</span></div>`).join('')}<p>${escape(value.note)}</p></section>`;
}
