const EXCHANGES=new Set(['US','LSE','DE','F','TO','V','PA','AS','MI','SW','L','HK','AU','BR','SA','MX','TA','ST','CO','OL','HE','IC','IR','WA','PR','BK','JK','KL','SN']);
export function resolveSecurityIdentity(value){const raw=String(value??'').trim().toUpperCase();if(!/^[A-Z0-9._-]{1,20}$/.test(raw))return{status:'invalid',reason:'A valid security identifier is required.'};const parts=raw.split('.'),last=parts.at(-1);if(parts.length===1)return{status:'resolved',canonical:`${raw}.US`,eodhd:`${raw}.US`,sentisense:raw,sentisenseStatus:'supported'};if(!EXCHANGES.has(last))return{status:'ambiguous',reason:'Dotted symbols without a recognized exchange are ambiguous; select the security from search.'};const base=parts.slice(0,-1).join('.'),supported=last==='US';return{status:'resolved',canonical:raw,eodhd:raw,sentisense:supported?base:null,sentisenseStatus:supported?'supported':'unsupported-market'}}
export function resolveListedSecurity(ticker,exchange){
  const raw=String(ticker??'').trim().toUpperCase(),market=String(exchange??'').trim().toUpperCase();
  if(!raw||!market)return{status:'invalid',reason:'Listed security rows require both ticker and exchange.'};
  const supplied=resolveSecurityIdentity(raw);
  if(supplied.status==='resolved'&&raw.includes('.'))return supplied.canonical.endsWith(`.${market}`)?supplied:{status:'contradictory',reason:`Ticker ${raw} conflicts with exchange ${market}.`};
  return resolveSecurityIdentity(`${raw}.${market}`);
}
