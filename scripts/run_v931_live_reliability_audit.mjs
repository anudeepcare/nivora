import fs from 'node:fs';
import path from 'node:path';

const base=String(process.env.AURYN_BASE_URL||'').replace(/\/$/,'');
if(!base){console.error('AURYN_BASE_URL is required, e.g. https://your-app.vercel.app');process.exitCode=1;process.exit();}
const token=String(process.env.AURYN_AUDIT_TOKEN||'');
const headers=token?{Authorization:`Bearer ${token}`}:{ };
const cliLimit=Number((process.argv.find(x=>x.startsWith('--limit='))||'').split('=')[1]||process.env.AURYN_V931_LIVE_LIMIT||100);
const limit=Math.max(1,Math.min(500,Number.isFinite(cliLimit)?cliLimit:100));
const delayMs=Math.max(0,Number(process.env.AURYN_V931_LIVE_DELAY_MS||300));
const maxRetries=Math.max(0,Math.min(4,Number(process.env.AURYN_V931_LIVE_MAX_RETRIES||2)));
const reportPath=process.env.AURYN_AUDIT_REPORT||path.join('artifacts',`v931-live-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const finite=x=>{const n=Number(x);return Number.isFinite(n)?n:null};
const pctGap=(a,b)=>a!=null&&b!=null&&Math.max(Math.abs(a),Math.abs(b))>0?Math.abs(a-b)/Math.max(Math.abs(a),Math.abs(b))*100:null;

async function requestJson(route){
 for(let attempt=0;attempt<=maxRetries;attempt++){
  try{
   const r=await fetch(`${base}${route}`,{headers,cache:'no-store'});let json={};try{json=await r.json()}catch{}
   if(r.status===429&&attempt<maxRetries){const retry=Number(r.headers.get('retry-after'));await sleep(Number.isFinite(retry)?Math.max(750,retry*1000):1500*(attempt+1));continue;}
   return{ok:r.ok,status:r.status,json,statusText:r.statusText};
  }catch(error){if(attempt===maxRetries)return{ok:false,status:0,json:{error:String(error)},statusText:'network error'};await sleep(1000*(attempt+1));}
 }
 return{ok:false,status:0,json:{error:'retry budget exhausted'},statusText:'retry budget exhausted'};
}
async function mustJson(route){const r=await requestJson(route);if(!r.ok)throw new Error(`${r.status} ${route}: ${r.json?.error||r.statusText}`);return r.json;}
async function loadSymbols(){
 const u=await mustJson(`/api/audit/universe?limit=${limit}`);
 const symbols=Array.isArray(u?.symbols)?u.symbols.map(x=>String(x||'').trim().toUpperCase()).filter(Boolean):[];
 const fallback=['SPY','QQQ','IWM','AAPL','MSFT','NVDA','AMZN','META','GOOGL','AVGO','TSLA','AMD','JPM','XOM','UNH','IREN','BE','ASTS','SAP'];
 return [...new Set([...symbols,...fallback])].slice(0,limit);
}
async function loadBatches(symbols,route){
 const out=new Map();
 for(let i=0;i<symbols.length;i+=40){
  const chunk=symbols.slice(i,i+40);const j=await mustJson(`${route}?symbols=${encodeURIComponent(chunk.join(','))}${route==='/api/scan'?'&limit=40':''}`);
  for(const item of j?.items||[])if(item?.symbol)out.set(String(item.symbol).toUpperCase(),item);
  await sleep(delayMs);
 }
 return out;
}

let symbols=[];
try{symbols=await loadSymbols();}catch(error){console.error(`critical: unable to load audit universe: ${error?.message||error}`);process.exitCode=1;process.exit();}
if(!symbols.length){console.error('critical: no symbols available for live audit');process.exitCode=1;process.exit();}

let summaries=new Map(),scans=new Map();
try{summaries=await loadBatches(symbols,'/api/decision/summaries');}catch(error){console.warn(`decision-summary batch unavailable: ${error?.message||error}`);}
try{scans=await loadBatches(symbols,'/api/scan');}catch(error){console.warn(`scan batch unavailable: ${error?.message||error}`);}

const rows=[];let critical=0,warnings=0,researchSafe=0,executionReady=0,closedResearchSafe=0;
const sessions={},priceStates={},providerGaps=[];
for(let i=0;i<symbols.length;i++){
 const symbol=symbols[i],issues=[];let quote=null,analyze=null;
 try{
  const qr=await requestJson(`/api/quote/${encodeURIComponent(symbol)}`);if(!qr.ok)throw new Error(`${qr.status} quote: ${qr.json?.error||qr.statusText}`);quote=qr.json?.snapshot??qr.json?.marketTruth??qr.json;
  await sleep(delayMs);
  const ar=await requestJson(`/api/analyze/${encodeURIComponent(symbol)}`);if(ar.ok)analyze=ar.json;else if(!['UNSUPPORTED_INSTRUMENT','PROVIDER_COVERAGE_MISSING','MARKET_HISTORY_UNAVAILABLE','INSUFFICIENT_HISTORY'].includes(String(ar.json?.code||'')))issues.push(`critical: analyze ${ar.status}: ${ar.json?.error||ar.statusText}`);
 }catch(error){issues.push(`critical: ${error?.message||error}`);}

 if(quote){
  const qSymbol=String(quote.symbol||symbol).toUpperCase(),session=String(quote.session||'UNKNOWN'),priceState=String(quote.priceState||quote.integrityState||'UNKNOWN'),priceUse=String(quote.priceUse||'BLOCKED');
  const displayPrice=finite(quote.displayPrice),analysisPrice=finite(quote.decisionPrice),executionPrice=finite(quote.executionPrice),providerAgreementPct=finite(quote.providerAgreementPct??quote.disagreementPct);
  const research=Boolean(quote.priceSensitiveAllowed),executionTradable=Boolean(quote.executionTradable??quote.integrityTradable);
  sessions[session]=(sessions[session]||0)+1;priceStates[priceState]=(priceStates[priceState]||0)+1;if(providerAgreementPct!=null)providerGaps.push(providerAgreementPct);
  if(qSymbol!==symbol)issues.push(`critical: symbol identity ${qSymbol} != ${symbol}`);
  if(research)researchSafe++;
  if(executionTradable)executionReady++;
  if(research&&displayPrice==null)issues.push('critical: research-safe Market Truth has no displayPrice');
  if(research&&analysisPrice==null)issues.push('critical: research-safe Market Truth has no analysis decisionPrice');
  if(executionTradable&&(priceState!=='LIVE_VERIFIED'||executionPrice==null))issues.push(`critical: executionTradable without LIVE_VERIFIED finite execution price (${priceState})`);
  if(!executionTradable&&executionPrice!=null)issues.push('critical: blocked execution exposes executionPrice');
  if(['CLOSED','WEEKEND','HOLIDAY','AFTER_HOURS','PRE_MARKET','PREMARKET','OVERNIGHT'].includes(session)){
   if(research&&displayPrice!=null)closedResearchSafe++;
   if((priceState==='OFFICIAL_CLOSE'||priceUse==='RESEARCH_CLOSE')&&displayPrice==null)issues.push('critical: verified regular close is blank outside regular market');
   if(priceState==='OFFICIAL_CLOSE'&&executionTradable)issues.push('critical: OFFICIAL_CLOSE marked execution tradable');
  }
  if(executionTradable&&providerAgreementPct!=null&&providerAgreementPct>1)issues.push(`critical: execution allowed despite provider gap ${providerAgreementPct.toFixed(2)}%`);

  const summary=summaries.get(symbol);
  if(summary){
   const sPrice=finite(summary.displayPrice),crossSurfacePriceGapPct=pctGap(displayPrice,sPrice);
   if(String(summary.symbol||'').toUpperCase()!==symbol)issues.push('critical: decision summary symbol mismatch');
   if(crossSurfacePriceGapPct!=null){
    const sameSnapshot=quote.snapshotId&&summary.marketSnapshotId&&quote.snapshotId===summary.marketSnapshotId;
    const tolerance=sameSnapshot?0.0001:0.5;
    if(crossSurfacePriceGapPct>tolerance)issues.push(`critical: crossSurfacePriceGapPct ${crossSurfacePriceGapPct.toFixed(3)}% > ${tolerance}%`);
   }
   if(summary.executionTradable&&summary.priceState!=='LIVE_VERIFIED')issues.push('critical: summary execution truth diverges from LIVE_VERIFIED invariant');
   if(summary.canonicalAction&&summary.decisionRole!=='CANONICAL_LAST_VERIFIED')issues.push('critical: canonical action published without canonical decision role');
  }

  const scan=scans.get(symbol);
  if(scan){
   if(scan.signalRole&&scan.signalRole!=='DISCOVERY_SIGNAL')issues.push(`critical: scan signal role ${scan.signalRole} is not discovery-only`);
   const scanCurrent=finite(scan.price),scanGap=pctGap(displayPrice,scanCurrent);
   if(scan.snapshotId&&quote.snapshotId&&scan.snapshotId===quote.snapshotId&&scanGap!=null&&scanGap>0.0001)issues.push(`critical: same Market Truth snapshot differs between quote and scan by ${scanGap.toFixed(4)}%`);
  }

  if(analyze){
   const anchor=finite(analyze.analysisAnchorPrice??analyze.price);
   if(anchor==null)issues.push('critical: analysis completed without a finite completed-bar anchor');
   if(analyze.analysisAnchorRole&&String(analyze.analysisAnchorRole).toUpperCase().includes('LIVE'))issues.push(`critical: structural analysis anchor is mislabeled live (${analyze.analysisAnchorRole})`);
  }
 }
 const criticalIssues=issues.filter(x=>x.startsWith('critical:'));const warningIssues=issues.filter(x=>!x.startsWith('critical:'));critical+=criticalIssues.length;warnings+=warningIssues.length;
 rows.push({symbol,status:criticalIssues.length?'CRITICAL':issues.length?'WARN':'PASS',session:quote?.session??null,priceState:quote?.priceState??null,displayPrice:finite(quote?.displayPrice),providerAgreementPct:finite(quote?.providerAgreementPct??quote?.disagreementPct),marketSnapshotId:quote?.snapshotId??null,issues});
 console.log(`${String(i+1).padStart(3,' ')}/${symbols.length} ${symbol}: ${criticalIssues.length?'CRITICAL':issues.length?'WARN':'PASS'}${issues.length?` · ${issues.join(' | ')}`:''}`);
}
const report={version:'auryn-v9.3.1',kind:'REAL_WORLD_24X7_RELIABILITY_AUDIT',baseUrl:base,generatedAt:new Date().toISOString(),requested:limit,total:rows.length,status:critical?'FAIL':'PASS',critical,warnings,researchSafe,executionReady,closedResearchSafe,sessions,priceStates,providerAgreementPct:{samples:providerGaps.length,max:providerGaps.length?Math.max(...providerGaps):null,avg:providerGaps.length?providerGaps.reduce((a,b)=>a+b,0)/providerGaps.length:null},rows};
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));console.log(`AURYN V9.3.1 live audit report: ${reportPath}`);
if(critical>0)process.exitCode=1;
