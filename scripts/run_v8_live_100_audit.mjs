import * as goldenModule from '../.engine-test/auryn/v8/reality-audit.js';
const {V8_GOLDEN_UNIVERSE}=goldenModule;
const base=String(process.env.AURYN_BASE_URL||'').replace(/\/$/,'');
if(!base){console.error('AURYN_BASE_URL is required, e.g. https://your-app.vercel.app');process.exitCode=1;process.exit();}
const token=process.env.AURYN_AUDIT_TOKEN||'';
const delayMs=Math.max(0,Number(process.env.V8_LIVE_AUDIT_DELAY_MS||1400));
const headers=token?{Authorization:`Bearer ${token}`}:{ };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function json(path){const r=await fetch(`${base}${path}`,{headers,cache:'no-store'});let j={};try{j=await r.json()}catch{};if(!r.ok)throw new Error(`${r.status} ${path}: ${j?.error||r.statusText}`);return j;}
const rows=[];let critical=0;
for(let i=0;i<V8_GOLDEN_UNIVERSE.length;i++){
  const x=V8_GOLDEN_UNIVERSE[i];const symbol=x.symbol;const issues=[];
  try{
    const quote=await json(`/api/quote/${encodeURIComponent(symbol)}`);
    await sleep(delayMs);
    const analyze=await json(`/api/analyze/${encodeURIComponent(symbol)}`);
    const snap=quote?.snapshot??quote?.marketTruth??quote;
    const qSymbol=String(snap?.symbol??quote?.symbol??'').toUpperCase();
    if(qSymbol&&qSymbol!==symbol)issues.push(`critical: quote symbol ${qSymbol} != ${symbol}`);
    const allowed=Boolean(snap?.priceSensitiveAllowed);
    const decisionPrice=Number(snap?.decisionPrice);
    if(allowed&&!Number.isFinite(decisionPrice))issues.push('critical: priceSensitiveAllowed without finite decisionPrice');
    const analyzePrice=Number(analyze?.price);
    if(!Number.isFinite(analyzePrice))issues.push('critical: analyze price unavailable');
    if(allowed&&Number.isFinite(decisionPrice)&&Number.isFinite(analyzePrice)){
      const gap=Math.abs(analyzePrice-decisionPrice)/Math.max(0.01,Math.abs(decisionPrice))*100;
      if(gap>3)issues.push(`critical: canonical/analyze price gap ${gap.toFixed(2)}%`);
    }
    const providerGap=Number(snap?.providerAgreementPct??snap?.providerGapPct);
    if(allowed&&Number.isFinite(providerGap)&&providerGap>5)issues.push(`critical: tradable snapshot despite provider gap ${providerGap.toFixed(2)}%`);
  }catch(e){issues.push(`critical: ${e?.message||e}`);}
  const criticalIssues=issues.filter(x=>/^critical:/i.test(x));critical+=criticalIssues.length;
  rows.push({symbol,issues});
  console.log(`${String(i+1).padStart(3,' ')}/100 ${symbol}: ${issues.length?issues.join(' | '):'PASS'}`);
}
console.log(JSON.stringify({total:rows.length,passed:rows.filter(r=>!r.issues.length).length,critical,rows},null,2));
if(critical>0)process.exitCode=1;
