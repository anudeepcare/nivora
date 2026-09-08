import * as goldenModule from '../.engine-test/auryn/v8/reality-audit.js';
const {V8_GOLDEN_UNIVERSE}=goldenModule;
const base=String(process.env.AURYN_BASE_URL||'').replace(/\/$/,'');
if(!base){console.error('AURYN_BASE_URL is required, e.g. https://your-app.vercel.app');process.exitCode=1;process.exit();}
const token=process.env.AURYN_AUDIT_TOKEN||'';
const cliLimit=(process.argv.find(x=>x.startsWith('--limit='))||'').split('=')[1];
const requestedLimit=Math.max(1,Math.min(500,Number(cliLimit||process.env.V8_LIVE_AUDIT_LIMIT||100)));
const delayMs=Math.max(0,Number(process.env.V8_LIVE_AUDIT_DELAY_MS||1400));
const headers=token?{Authorization:`Bearer ${token}`}:{ };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function json(path){const r=await fetch(`${base}${path}`,{headers,cache:'no-store'});let j={};try{j=await r.json()}catch{};if(!r.ok)throw new Error(`${r.status} ${path}: ${j?.error||r.statusText}`);return j;}

async function loadSymbols(){
  const golden=V8_GOLDEN_UNIVERSE.map(x=>x.symbol);
  if(requestedLimit<=golden.length)return golden.slice(0,requestedLimit);
  const u=await json(`/api/audit/universe?limit=${requestedLimit}`);
  const live=Array.isArray(u?.symbols)?u.symbols.map(x=>String(x||'').trim().toUpperCase()).filter(Boolean):[];
  return [...new Set([...golden,...live])].slice(0,requestedLimit);
}

const rows=[];let critical=0;let symbols=[];
try{symbols=await loadSymbols();}catch(e){console.error(`critical: unable to load live audit universe: ${e?.message||e}`);process.exitCode=1;process.exit();}
if(symbols.length<requestedLimit){console.error(`critical: requested ${requestedLimit} live symbols but only ${symbols.length} are available`);process.exitCode=1;process.exit();}

let researchSafe=0,executionReady=0,officialClose=0,blocked=0;
for(let i=0;i<symbols.length;i++){
  const symbol=symbols[i];const issues=[];
  try{
    const quote=await json(`/api/quote/${encodeURIComponent(symbol)}`);
    await sleep(delayMs);
    const analyze=await json(`/api/analyze/${encodeURIComponent(symbol)}`);
    const snap=quote?.snapshot??quote?.marketTruth??quote;
    const qSymbol=String(snap?.symbol??quote?.symbol??'').toUpperCase();
    if(qSymbol&&qSymbol!==symbol)issues.push(`critical: quote symbol ${qSymbol} != ${symbol}`);

    const researchAllowed=Boolean(snap?.priceSensitiveAllowed);
    const executionTradable=Boolean(snap?.executionTradable??snap?.integrityTradable);
    const priceState=String(snap?.priceState??snap?.integrityState??'UNKNOWN');
    const decisionPrice=Number(snap?.decisionPrice);
    const providerGap=Number(snap?.providerAgreementPct??snap?.disagreementPct);

    if(researchAllowed)researchSafe++; else blocked++;
    if(executionTradable)executionReady++;
    if(priceState==='OFFICIAL_CLOSE')officialClose++;

    if(researchAllowed&&!Number.isFinite(decisionPrice))issues.push('critical: priceSensitiveAllowed without finite decisionPrice');
    if(!researchAllowed&&Number.isFinite(decisionPrice))issues.push('critical: blocked Market Truth still exposes a finite decisionPrice');
    if(executionTradable&&priceState!=='LIVE_VERIFIED')issues.push(`critical: execution tradable with non-verified state ${priceState}`);
    if(priceState==='OFFICIAL_CLOSE'&&executionTradable)issues.push('critical: official close incorrectly marked execution-tradable');
    if(executionTradable&&Number.isFinite(providerGap)&&providerGap>1)issues.push(`critical: execution-tradable snapshot despite provider gap ${providerGap.toFixed(2)}%`);

    const analyzePrice=Number(analyze?.price);
    if(!Number.isFinite(analyzePrice))issues.push('critical: analyze price unavailable');
    if(researchAllowed&&Number.isFinite(decisionPrice)&&Number.isFinite(analyzePrice)){
      const gap=Math.abs(analyzePrice-decisionPrice)/Math.max(0.01,Math.abs(decisionPrice))*100;
      if(gap>3)issues.push(`critical: canonical/analyze price gap ${gap.toFixed(2)}%`);
    }
  }catch(e){issues.push(`critical: ${e?.message||e}`);}
  const criticalIssues=issues.filter(x=>/^critical:/i.test(x));critical+=criticalIssues.length;
  rows.push({symbol,issues});
  console.log(`${String(i+1).padStart(3,' ')}/${symbols.length} ${symbol}: ${issues.length?issues.join(' | '):'PASS'}`);
}
console.log(JSON.stringify({requested:requestedLimit,total:rows.length,passed:rows.filter(r=>!r.issues.length).length,critical,researchSafe,executionReady,officialClose,blocked,rows},null,2));
if(critical>0)process.exitCode=1;
