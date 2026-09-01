import {NextResponse} from "next/server";import {providers,providersFor} from "@/lib/provider-registry";import {providerHealthSnapshot} from "@/lib/provider-resilience";import {rateLimitConfiguration} from "@/lib/rate-limit";import {ENGINE_VERSION,WEIGHTS_VERSION,VALUATION_VERSION,TODAY_POLICY_VERSION,TRADING_LAB_VERSION} from "@/lib/nivora-version";
export const dynamic="force-dynamic";
export async function GET(){
 const env={market:!!process.env.TWELVE_DATA_API_KEY,news:!!process.env.FINNHUB_API_KEY,options:!!process.env.MARKETDATA_TOKEN,database:!!process.env.NEXT_PUBLIC_SUPABASE_URL,validation:!!process.env.SUPABASE_SERVICE_ROLE_KEY,tradingLabPaper:!!(process.env.ALPACA_PAPER_API_KEY&&process.env.ALPACA_PAPER_API_SECRET)};
 const configured=Object.values(env).filter(Boolean).length;const caps=["quotes","candles","fundamentals","news","earnings","options"] as const;
 const redundancy=Object.fromEntries(caps.map(c=>[c,{providers:providersFor(c).map(p=>p.id),redundant:providersFor(c).length>1}]));const limiter=rateLimitConfiguration();
 const runtimeProviders=providers.map(p=>({...p,health:providerHealthSnapshot(p.id)}));
 return NextResponse.json({status:configured>=4&&limiter.status!=="DEGRADED_LOCAL_FALLBACK"?"operational":"degraded",architecture:`NIVORA ${ENGINE_VERSION.toUpperCase()}`,versions:{engine:ENGINE_VERSION,weights:WEIGHTS_VERSION,valuation:VALUATION_VERSION,todayPolicy:TODAY_POLICY_VERSION,tradingLab:TRADING_LAB_VERSION},configured,expected:Object.keys(env).length,capabilities:env,rateLimiter:limiter,redundancy,providers:runtimeProviders,note:"Provider health is runtime telemetry; Arena and persisted scan freshness remain the evidence source for predictive and universe-level reliability."});
}
