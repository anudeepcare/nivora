import {NextResponse} from "next/server";
import {providers} from "@/lib/provider-registry";
export const dynamic="force-dynamic";
export async function GET(){
 const env={
  market:!!process.env.TWELVE_DATA_API_KEY,
  news:!!process.env.FINNHUB_API_KEY,
  options:!!process.env.MARKETDATA_TOKEN,
  database:!!process.env.NEXT_PUBLIC_SUPABASE_URL,
  validation:!!process.env.SUPABASE_SERVICE_ROLE_KEY
 };
 const configured=Object.values(env).filter(Boolean).length;
 return NextResponse.json({
  status:configured>=4?"operational":"degraded",
  architecture:"NIVORA V30",
  configured,expected:Object.keys(env).length,
  capabilities:env,
  providers:providers.map(p=>({id:p.id,capabilities:p.capabilities,realTime:p.realTime}))
 });
}