import {NextResponse} from 'next/server';
import {enabledAuthProviders} from '@/lib/auth-providers';
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 try {
  if(!url||!key)throw Error('unconfigured');
  const response=await fetch(`${url.replace(/\/$/,'')}/auth/v1/settings`,{headers:{apikey:key},signal:AbortSignal.timeout(4000),next:{revalidate:300}});
  if(!response.ok)throw Error('unavailable');
  return NextResponse.json(enabledAuthProviders(await response.json()),{headers:{'Cache-Control':'public, max-age=60, s-maxage=300'}});
 }catch{return NextResponse.json({google:null,x:null},{headers:{'Cache-Control':'no-store'}});}
}
