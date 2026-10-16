"use client";
import {useEffect, useMemo, useState} from 'react';
import {Bitcoin} from 'lucide-react';

const brands: Record<string, string> = {AAPL:'apple', MSFT:'microsoft', NVDA:'nvidia', AMZN:'amazon', GOOGL:'google', GOOG:'google', META:'meta', TSLA:'tesla', NFLX:'netflix', AMD:'amd', ADBE:'adobe', CRM:'salesforce', SHOP:'shopify', SPOT:'spotify'};

export default function AssetLogo({symbol, name, logoUrl, size = 40}: {symbol: string; name?: string; logoUrl?: string | null; size?: number}) {
  const key = symbol.toUpperCase();
  const crypto = /^(BTC|ETH)([\/-]|$)/.exec(key)?.[1];
  const candidates = useMemo(() => [...new Set([
    logoUrl && /^https:\/\//i.test(logoUrl) ? logoUrl : null,
    brands[key] ? `https://cdn.simpleicons.org/${brands[key]}/334155` : null,
    !key.includes('/') ? `https://financialmodelingprep.com/image-stock/${encodeURIComponent(key)}.png` : null,
  ].filter((value): value is string => Boolean(value)))], [key, logoUrl]);
  const [index, setIndex] = useState(0),[loaded,setLoaded]=useState(false);
  useEffect(() => {setIndex(0);setLoaded(false)}, [key, logoUrl]);
  return <span className={`assetLogo ${crypto ? `assetLogo${crypto}` : ''}`} style={{width:size, height:size, minWidth:size}} aria-hidden="true">
    {crypto === 'BTC' ? <Bitcoin size={28} strokeWidth={2.2}/> : key === 'MSFT' ? <svg viewBox="0 0 24 24" width="26" height="26"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#7fba00" d="M13 1h10v10H13z"/><path fill="#00a4ef" d="M1 13h10v10H1z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg> : crypto === 'ETH' ? <svg viewBox="0 0 32 32" width="26" height="26"><path fill="currentColor" d="m16 2-9 15 9 5 9-5L16 2Zm0 22-9-5 9 12 9-12-9 5Z"/></svg> : candidates[index] ? <><b className="assetLogoFallback" style={{visibility:loaded?"hidden":"visible"}}>{key.slice(0,2)}</b><img key={candidates[index]} src={candidates[index]} alt="" loading="lazy" referrerPolicy="no-referrer" style={{opacity:loaded?1:0}} onLoad={e=>{if(e.currentTarget.naturalWidth<4||e.currentTarget.naturalHeight<4){setLoaded(false);setIndex(value=>value+1)}else setLoaded(true)}} onError={() => {setLoaded(false);setIndex(value => value + 1)}}/></> : <b title={name || key}>{key.slice(0, 2)}</b>}
  </span>;
}
