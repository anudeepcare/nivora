const finite=value=>typeof value==='number'&&Number.isFinite(value);
const itemsFrom=data=>Array.isArray(data)?data:Array.isArray(data?.holders)?data.holders:Array.isArray(data?.results)?data.results:Array.isArray(data?.items)?data.items:[];
const allowed=new Set(['institutional','insider','congress']);
const labelFor=item=>item?.institution??item?.ownerName??item?.name??item?.politicianName??item?.politician??null;
const actionFor=item=>item?.transactionType??item?.transactionCode??item?.action??null;
const number=value=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value);

export function buildOwnershipEvidence(sections={}){
  const entries=[...(sections.ownership?.data||[]),...(sections.publicOfficials?.data||[])],nodes=[];
  for(const entry of entries){
    if(!allowed.has(entry?.category))continue;
    for(const item of itemsFrom(entry.data)){
      const label=labelFor(item);
      if(typeof label!=='string'||!label.trim())continue;
      nodes.push({category:entry.category,label:label.trim(),source:entry.source??'Unknown source',preview:entry.status==='preview'||/PREVIEW SAMPLE/.test(entry.source??''),asOf:entry.asOf??item.reportDate??item.date??item.transactionDate??null,role:item.role??item.position??null,owner:item.owner??null,shares:finite(item.shares)?item.shares:finite(item.transactionAmount)?item.transactionAmount:null,ownershipPercentage:finite(item.ownershipPercentage)?item.ownershipPercentage:null,action:actionFor(item),date:item.date??item.transactionDate??null,filedAt:item.filedAt??item.filingDate??item.disclosureDate??null,amountRange:item.amountRange??null,relationship:'reported-record'});
    }
  }
  const chronology=node=>node.category==='congress'?node.filedAt??node.date:node.date??node.filedAt;
  const transactions=nodes.filter(node=>node.action||node.date||node.filedAt).sort((a,b)=>String(chronology(b)??'').localeCompare(String(chronology(a)??'')));
  return{status:nodes.length?'available':'unavailable',nodes,transactions,reason:nodes.length?null:'No explicitly categorized ownership or filing records were returned.'};
}

const details=node=>[node.role,node.owner?`owner ${node.owner}`:null,finite(node.ownershipPercentage)?`${number(node.ownershipPercentage)}% ownership`:null,finite(node.shares)?`${number(node.shares)} shares`:null,node.amountRange,node.asOf?`as of ${node.asOf}`:null].filter(Boolean);

function networkMap(nodes,escape){
  const shown=nodes.slice(0,12),center=50,radius=38;
  const points=shown.map((node,index)=>{const angle=-Math.PI/2+(Math.PI*2*index/Math.max(shown.length,1));return{node,x:Math.round((center+Math.cos(angle)*radius)*100)/100,y:Math.round((center+Math.sin(angle)*radius)*100)/100}});
  return`<svg class="ownership-network-map" viewBox="0 0 100 100" role="img" aria-label="Reported ownership and filing relationship map"><circle class="ownership-subject" cx="50" cy="50" r="10"><title>Research subject</title></circle>${points.map(({node,x,y})=>`<line class="ownership-edge" data-evidence-category="${node.category}" x1="50" y1="50" x2="${x}" y2="${y}"></line>`).join('')}${points.map(({node,x,y})=>`<circle class="ownership-point" data-evidence-category="${node.category}" cx="${x}" cy="${y}" r="3"><title>${escape(node.label)} · ${escape(node.category)} · ${escape(node.source)}</title></circle>`).join('')}</svg><p class="ownership-map-note"><span data-map-count>${shown.length}</span> of <span data-map-total>${nodes.length}</span> reported records shown in the diagram · equal spokes indicate reported association only, not ownership or influence weight.</p>`;
}

export function renderOwnershipEvidence(value,escape=input=>String(input)){
  const filters=[['all','All'],['institutional','Institutions'],['insider','Insiders'],['congress','Congress']];
  if(value?.status!=='available')return`<section class="evidence-workbench"><header><div><small>OWNERSHIP</small><h2>Who owns the next decision?</h2></div><div class="control-strip">${filters.map(([key,label])=>`<button data-owner="${key}" disabled>${label}</button>`).join('')}</div></header><div class="ownership-layout"><article><small>OWNERSHIP NETWORK</small><div class="network-empty"><b>Unavailable</b><p>${escape(value?.reason||'Verified categorized records are required.')}</p></div></article><article><small>TRANSACTION TAPE</small><div class="structure-empty"><strong>Unavailable</strong><p>No eligible filing records.</p></div></article></div><footer class="tag">PROVIDER-GATED · NO INFERRED RELATIONSHIPS</footer></section>`;
  const cards=value.nodes.map(node=>`<article data-evidence-category="${node.category}" class="ownership-node"><small>${escape(node.category.toUpperCase())}${node.preview?' · PREVIEW SAMPLE':''}</small><b>${escape(node.label)}</b><span>${details(node).map(escape).join(' · ')||'Reported identity only'}</span><em>${escape(node.source)} · reported record · no inferred edge weight</em></article>`).join('');
  const tape=value.transactions.length?value.transactions.map(node=>`<div class="ownership-transaction" data-evidence-category="${node.category}"><b>${escape(node.label)}</b><span>${escape(node.action||'Action unavailable')}${node.owner?` · ${escape(node.owner)}`:''}${finite(node.shares)?` · ${escape(number(node.shares))} shares`:''}${node.amountRange?` · ${escape(node.amountRange)}`:''}${node.date?` · transaction ${escape(node.date)}`:''}${node.filedAt?` · filed ${escape(node.filedAt)}`:''}</span><small>${escape(node.source)}${node.preview?' · PREVIEW SAMPLE':''}</small></div>`).join(''):'<p>No transaction-like records returned.</p>';
  return`<section class="evidence-workbench"><header><div><small>OWNERSHIP</small><h2>Who owns the next decision?</h2></div><div class="control-strip">${filters.map(([key,label],index)=>`<button data-owner="${key}" class="${index===0?'active':''}">${label}</button>`).join('')}</div></header><div class="ownership-layout"><article><small>OWNERSHIP NETWORK</small>${networkMap(value.nodes,escape)}<div class="ownership-network" aria-label="Source-linked ownership and filing records"><div class="ownership-center">COMPANY<br><small>RESEARCH SUBJECT</small></div>${cards}</div></article><article><small>TRANSACTION TAPE</small><div class="evidence-row"><b>Entity</b><span>Action · owner · shares/range · transaction date · filed date</span></div>${tape}</article></div><footer class="tag">SOURCE-LINKED REPORTED RECORDS · FILING DELAY REMAINS VISIBLE · NO INFERRED NETWORK WEIGHTS</footer></section>`;
}
