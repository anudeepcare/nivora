import {NextResponse} from "next/server";import {providers,providersFor} from "@/lib/provider-registry";
export const dynamic="force-dynamic";
export async function GET(){
 const env={market:!!process.env.TWELVE_DATA_API_KEY,news:!!process.env.FINNHUB_API_KEY,options:!!process.env.MARKETDATA_TOKEN,database:!!process.env.NEXT_PUBLIC_SUPABASE_URL,validation:!!process.env.SUPABASE_SERVICE_ROLE_KEY};
 const configured=Object.values(env).filter(Boolean).length;const caps=["quotes","candles","fundamentals","news","earnings","options"] as const;
 const redundancy=Object.fromEntries(caps.map(c=>[c,{providers:providersFor(c).map(p=>p.id),redundant:providersFor(c).length>1}]));
 return NextResponse.json({status:configured>=4?"operational":"degraded",architecture:"NIVORA V57",configured,expected:Object.keys(env).length,capabilities:env,redundancy,providers:providers.map(p=>({id:p.id,capabilities:p.capabilities,realTime:p.realTime})),note:"A capability marked non-redundant remains a provider single point of failure; V57 exposes this rather than implying failover exists."});
}
