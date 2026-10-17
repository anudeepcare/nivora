"use client";
import {navigateToLogin} from "@/lib/client-auth-navigation";
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {supabaseBrowser} from '@/lib/supabase';
export default function AuthGuard({children}:{children:React.ReactNode}){
 const [ready,setReady]=useState(false),[error,setError]=useState('');const router=useRouter();
 useEffect(()=>{let alive=true;let unsubscribe=()=>{};
 const timer=setTimeout(()=>{if(alive)setError('We could not verify your session. Please try signing in again.')},12000);
 try{const sb=supabaseBrowser();sb.auth.getSession().then(({data,error})=>{if(!alive)return;clearTimeout(timer);if(error){setError(error.message);return}if(data.session)setReady(true);else router.replace('/login')}).catch(()=>{if(alive)setError('Unable to connect. Check your connection and try again.')});
 const {data}=sb.auth.onAuthStateChange((event,session)=>{if(!alive)return;if(event==='SIGNED_OUT'){setReady(false);navigateToLogin()}else if(session){setReady(true);setError('')}});unsubscribe=()=>data.subscription.unsubscribe();
 }catch{setError('Sign-in is not configured for this installation. Please contact the account administrator.')}
 return()=>{alive=false;clearTimeout(timer);unsubscribe()};},[router]);
 if(error)return <main className="uxState" role="alert"><h1>Unable to open your workspace</h1><p>{error}</p><Link href="/login">Back to sign in</Link><button onClick={()=>window.location.reload()}>Try again</button></main>;
 if(!ready)return <div className="uxState" role="status"><div className="uxSpinner"/><p>Opening your workspace…</p></div>;
 return <>{children}</>;
}
