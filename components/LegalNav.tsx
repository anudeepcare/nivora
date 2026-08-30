"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft} from "lucide-react";
import {supabaseBrowser} from "@/lib/supabase";

export default function LegalNav(){
  const [signedIn,setSignedIn]=useState<boolean|null>(null);
  const router=useRouter();
  useEffect(()=>{
    let alive=true;
    const sb=supabaseBrowser();
    sb.auth.getSession().then(({data})=>{if(alive)setSignedIn(Boolean(data.session))}).catch(()=>{if(alive)setSignedIn(false)});
    return()=>{alive=false};
  },[]);
  const fallback=signedIn?"/dashboard":"/";
  function goBack(){
    // Legal/help pages should return the user to the page they came from.
    // Fall back safely when the page was opened directly/new tab.
    try{
      const ref=document.referrer?new URL(document.referrer):null;
      if(ref&&ref.origin===window.location.origin){router.back();return;}
    }catch{}
    router.push(fallback);
  }
  return <div className="legalTop">
    <button type="button" className="legalBack" onClick={goBack}><ArrowLeft size={15}/> Back</button>
    <Link href={fallback} className="osLogo v37Logo"><span className="v37Wordmark">NIVORA<span>.</span></span><small>Decision Intelligence</small></Link>
  </div>;
}
