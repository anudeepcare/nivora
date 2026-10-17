import {NextResponse} from 'next/server';
import {sharedJson} from '@/lib/shared-cache';
import {verifiedProfileLogo} from '@/lib/asset-identity';

// Reuses the existing company-profile cache; no new market-data subscription.
export async function GET(_:Request,{params}:{params:Promise<{symbol:string}>}){
 const {symbol:raw}=await params,symbol=raw.toUpperCase();
 if(!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))return NextResponse.json({logoUrl:null},{status:400});
 const key=process.env.FINNHUB_API_KEY;
 if(!key)return NextResponse.json({logoUrl:null},{headers:{'Cache-Control':'public, max-age=300'}});
 try{
  const profile=await sharedJson(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key}`,['finnhub','profile',symbol],86400);
  return NextResponse.json({logoUrl:verifiedProfileLogo(symbol,profile)},{headers:{'Cache-Control':'public, max-age=86400, s-maxage=86400'}});
 }catch{return NextResponse.json({logoUrl:null},{headers:{'Cache-Control':'public, max-age=300'}})}
}
