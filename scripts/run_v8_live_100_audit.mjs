import * as goldenModule from '../.engine-test/auryn/v8/reality-audit.js';
import * as auditHelperModule from '../.engine-test/auryn/v83/audit-helpers.js';
const {V8_GOLDEN_UNIVERSE}=goldenModule;
const {finiteNumberOrNull,blockedDecisionPriceLeak,canonicalAnalyzeGapPct}=auditHelperModule;
const base=String(process.env.AURYN_BASE_URL||'').replace(/\/$/,'');
if(!base){console.error('AURYN_BASE_URL is required, e.g. https://your-app.vercel.app');process.exitCode=1;process.exit();}
const token=process.env.AURYN_AUDIT_TOKEN||'';
const cliLimit=(process.argv.find(x=>x.startsWith('--limit='))||'').split('=')[1];
const requestedLimit=Math.max(1,Math.min(500,Number(cliLimit||process.env.V8_LIVE_AUDIT_LIMIT||100)));
const delayMs=Math.max(0,Number(process.env.V8_LIVE_AUDIT_DELAY_MS||1800));
const AUDIT_MAX_RETRIES=Math.max(0,Math.min(5,Number(process.env.V8_LIVE_AUDIT_MAX_RETRIES||2)));
const fallbackBackoffMs=Math.max(500,Number(process.env.V8_LIVE_AUDIT_BACKOFF_MS||2500));
const headers=token?{Authorization:`Bearer ${token}`}:{ };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let rateLimitRetries=0;

function retryAfterMs(response,attempt){
  const raw=String(response.headers.get('Retry-After')||'').trim();
  const seconds=Number(raw);
  if(Number.isFinite(seconds)&&seconds>=0)return Math.max(500,seconds*1000);
  const when=Date.parse(raw);
  if(Number.isFinite(when))return Math.max(500,when-Date.now());
  return Math.min(60_000,fallbackBackoffMs*(2**attempt));
}

async function requestJson(path){
  for(let attempt=0;attempt<=AUDIT_MAX_RETRIES;attempt++){
    const r=await fetch(`${base}${path}`,{headers,cache:'no-store'});
    let j={};try{j=await r.json()}catch{}
    if(r.status===429&&attempt<AUDIT_MAX_RETRIES){
      rateLimitRetries++;
      const waitMs=retryAfterMs(r,attempt);
      console.warn(`rate-limit retry ${attempt+1}/${AUDIT_MAX_RETRIES} for ${path}; waiting ${Math.ceil(waitMs/1000)}s`);
      await sleep(waitMs);
      continue;
    }
    return{ok:r.ok,status:r.status,json:j,statusText:r.statusText,retryAfter:r.headers.get('Retry-After')};
  }
  return{ok:false,status:429,json:{error:'Rate limit retry budget exhausted.'},statusText:'Too Many Requests',retryAfter:null};
}
async function json(path){const x=await requestJson(path);if(!x.ok)throw new Error(`${x.status} ${path}: ${x.json?.error||x.statusText}`);return x.json;}
const QUARANTINE_CODES=new Set(['UNSUPPORTED_INSTRUMENT','PROVIDER_COVERAGE_MISSING','MARKET_HISTORY_UNAVAILABLE','INSUFFICIENT_HISTORY']);

async function loadSymbols(){
  const golden=V8_GOLDEN_UNIVERSE.map(x=>x.symbol);
  if(requestedLimit<=golden.length)return golden.slice(0,requestedLimit);
  const u=await json(`/api/audit/universe?limit=${requestedLimit}`);
  const live=Array.isArray(u?.symbols)?u.symbols.map(x=>String(x||'').trim().toUpperCase()).filter(Boolean):[];
  return [...new Set([...golden,...live])].slice(0,requestedLimit);
}

const rows=[];let critical=0;let symbols=[];
try{symbols=await loadSymbols();}catch(e){console.error(`critical: unable to load live audit universe: ${e?.message||e}`);process.exitCode=1;process.exit();}
if(symbols.length<requestedLimit){console.error(`critical: requested ${requestedLimit} live symbols but only ${symbols.length} supported symbols are available`);process.exitCode=1;process.exit();}

let researchSafe=0,executionReady=0,officialClose=0,blocked=0,quarantined=0;
for(let i=0;i<symbols.length;i++){
  const symbol=symbols[i];const issues=[];let quarantineCode=null;
  try{
    const quoteResponse=await requestJson(`/api/quote/${encodeURIComponent(symbol)}`);
    if(!quoteResponse.ok)throw new Error(`${quoteResponse.status} /api/quote/${encodeURIComponent(symbol)}: ${quoteResponse.json?.error||quoteResponse.statusText}`);
    const quote=quoteResponse.json;
    await sleep(delayMs);
    const analyzeResponse=await requestJson(`/api/analyze/${encodeURIComponent(symbol)}`);
    const analyze=analyzeResponse.json;
    const code=String(analyze?.code||'');
    if(!analyzeResponse.ok&&QUARANTINE_CODES.has(code)){
      quarantineCode=code;quarantined++;
      issues.push(`quarantine: ${code}${analyze?.error?` — ${analyze.error}`:''}`);
    }else if(!analyzeResponse.ok){
      throw new Error(`${analyzeResponse.status} /api/analyze/${encodeURIComponent(symbol)}: ${analyze?.error||analyzeResponse.statusText}`);
    }

    const snap=quote?.snapshot??quote?.marketTruth??quote;
    const qSymbol=String(snap?.symbol??quote?.symbol??'').toUpperCase();
    if(qSymbol&&qSymbol!==symbol)issues.push(`critical: quote symbol ${qSymbol} != ${symbol}`);

    const researchAllowed=Boolean(snap?.priceSensitiveAllowed);
    const executionTradable=Boolean(snap?.executionTradable??snap?.integrityTradable);
    const priceState=String(snap?.priceState??snap?.integrityState??'UNKNOWN');
    const decisionPrice=finiteNumberOrNull(snap?.decisionPrice);
    const providerGap=finiteNumberOrNull(snap?.providerAgreementPct??snap?.disagreementPct);

    if(researchAllowed)researchSafe++; else blocked++;
    if(executionTradable)executionReady++;
    if(priceState==='OFFICIAL_CLOSE')officialClose++;

    if(researchAllowed&&decisionPrice===null)issues.push('critical: priceSensitiveAllowed without finite decisionPrice');
    if(blockedDecisionPriceLeak(researchAllowed,snap?.decisionPrice))issues.push('critical: blocked Market Truth still exposes a finite decisionPrice');
    if(executionTradable&&priceState!=='LIVE_VERIFIED')issues.push(`critical: execution tradable with non-verified state ${priceState}`);
    if(priceState==='OFFICIAL_CLOSE'&&executionTradable)issues.push('critical: official close incorrectly marked execution-tradable');
    if(executionTradable&&providerGap!==null&&providerGap>1)issues.push(`critical: execution-tradable snapshot despite provider gap ${providerGap.toFixed(2)}%`);

    if(!quarantineCode){
      const analyzePrice=finiteNumberOrNull(analyze?.price);
      if(analyzePrice===null)issues.push('critical: analyze price unavailable');
      const gap=canonicalAnalyzeGapPct(decisionPrice,analyzePrice);
      if(researchAllowed&&gap!==null&&gap>3)issues.push(`critical: canonical/analyze price gap ${gap.toFixed(2)}%`);
    }
  }catch(e){issues.push(`critical: ${e?.message||e}`);}
  const criticalIssues=issues.filter(x=>/^critical:/i.test(x));critical+=criticalIssues.length;
  rows.push({symbol,status:criticalIssues.length?'CRITICAL':quarantineCode?'QUARANTINED':'PASS',issues});
  console.log(`${String(i+1).padStart(3,' ')}/${symbols.length} ${symbol}: ${issues.length?issues.join(' | '):'PASS'}`);
}
const passed=rows.filter(r=>r.status==='PASS').length;
console.log(JSON.stringify({requested:requestedLimit,total:rows.length,passed,quarantined,critical,researchSafe,executionReady,officialClose,blocked,rateLimitRetries,rows},null,2));
if(critical>0)process.exitCode=1;
