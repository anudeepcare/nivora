import{buildTechnicalEvidence}from'./technical-view.js';

const finite=value=>typeof value==='number'&&Number.isFinite(value);
const groups=['Trend','Momentum','Volatility','Volume','Relative strength','Breadth','Quality','Growth','Margins','Valuation','Revisions','Risk'];
const driverMap=scenarios=>Object.fromEntries((scenarios?.drivers||[]).map(row=>[row.name,row.value]));
const strictDay=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const date=new Date(`${value}T00:00:00Z`);return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value?value:null};

export function buildIndicatorEvidence(analytics){
  const technical=buildTechnicalEvidence(analytics?.history,analytics?.benchmarkHistory),values={};
  if(technical.status==='available'){
    const rows=technical.rows,last=rows.at(-1),first=rows[0],recent=rows.slice(-20);
    values.Momentum={value:`${((last.close/first.close-1)*100).toFixed(2)}%`,period:`${first.date} — ${last.date}`};
    if(recent.length===20){
      const average=recent.reduce((sum,row)=>sum+row.close,0)/20,returns=recent.slice(1).map((row,index)=>row.close/recent[index].close-1),mean=returns.reduce((sum,value)=>sum+value,0)/returns.length,variance=returns.reduce((sum,value)=>sum+(value-mean)**2,0)/(returns.length-1),volatility=Math.sqrt(variance)*Math.sqrt(252);
      values.Trend={value:last.close>=average?'Above 20-close average':'Below 20-close average',period:`20 closes ending ${last.date}`};
      if(finite(volatility))values.Volatility={value:`${(volatility*100).toFixed(2)}% annualized`,period:`20 closes · 19 returns ending ${last.date}`};
      if(recent.every(row=>finite(row.volume)&&row.volume>=0)){const volumeAverage=recent.reduce((sum,row)=>sum+row.volume,0)/20,ratio=volumeAverage>0?last.volume/volumeAverage:null;if(finite(ratio))values.Volume={value:`${ratio.toFixed(2)}× 20-close average`,period:`Latest ${last.volume.toLocaleString()} · average ${Math.round(volumeAverage).toLocaleString()} · ${last.date}`}}
    }
    let peak=rows[0].close,maxDrawdown=0;for(const row of rows){peak=Math.max(peak,row.close);maxDrawdown=Math.min(maxDrawdown,row.close/peak-1)}values.Risk={value:`${(maxDrawdown*100).toFixed(2)}% max drawdown`,period:`Dated close history · ${first.date} — ${last.date}`};
    if(technical.relative.status==='available'){const relative=technical.relative;values['Relative strength']={value:`${relative.last.relativePercent.toFixed(2)} percentage points vs ${relative.benchmark}`,period:`${relative.rows.length} shared closes · ${relative.first.date} — ${relative.last.date}`}}
  }
  const scenarioDate=strictDay(analytics?.scenarios?.asOf);if(analytics?.scenarios?.status==='available'&&scenarioDate){const drivers=driverMap(analytics.scenarios),growth=drivers['Forward revenue growth estimate'],margin=drivers['Operating margin'],period=`Filed/estimate evidence · ${scenarioDate}`;if(finite(growth))values.Growth={value:`${(growth*100).toFixed(2)}%`,period};if(finite(margin))values.Margins={value:`${(margin*100).toFixed(2)}%`,period}}
  return{status:Object.keys(values).length?'available':'unavailable',values,groups,source:technical.status==='available'?technical.source:null,benchmark:technical.relative?.status==='available'?technical.relative.benchmark:null,reason:Object.keys(values).length?null:'Eligible dated history or model evidence is required.'};
}

export function renderIndicatorEvidence(value,escape=input=>String(input)){
  const tag=value.status==='available'?[value.source?'DATED '+value.source:null,value.benchmark?`ADJUSTED ${value.benchmark} COMPARISON`:null].filter(Boolean).join(' · '):'PROVIDER-GATED';
  return`<section class="evidence-workbench"><header><div><small>INDICATORS</small><h2>Twelve signals, each with context.</h2></div><span class="tag">${escape(tag)}</span></header><div class="indicator-wall" aria-label="INDICATOR WALL">${value.groups.map(name=>`<article><small>${escape(name)}</small><strong>${escape(value.values[name]?.value??'Unavailable')}</strong><p>${escape(value.values[name]?.period??'Value, direction, period and source required.')}</p></article>`).join('')}</div></section>`;
}
