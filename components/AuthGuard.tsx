"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabaseBrowser} from "@/lib/supabase";
export default function AuthGuard({children}:{children:React.ReactNode}){
  const [ready,setReady]=useState(false); const r=useRouter();
  useEffect(()=>{let alive=true; const s=supabaseBrowser();
    const timer=setTimeout(()=>{if(alive)setReady(true)},900);
    s.auth.getSession().then(({data})=>{if(!alive)return; clearTimeout(timer); if(data.session)setReady(true); else r.replace('/login')}).catch(()=>{if(alive)setReady(true)});
    return()=>{alive=false;clearTimeout(timer)};
  },[r]);
  if(!ready) return <div className="fastBoot"><div className="fastBootLogo">NIVORA<span>.</span></div><div className="bootLine"/></div>;
  return <>{children}</>;
}
