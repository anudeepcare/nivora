"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabaseBrowser} from "@/lib/supabase";

export default function LegalNav(){
  const [signedIn,setSignedIn]=useState<boolean|null>(null);
  useEffect(()=>{
    let alive=true;
    const sb=supabaseBrowser();
    sb.auth.getSession().then(({data})=>{if(alive)setSignedIn(Boolean(data.session))}).catch(()=>{if(alive)setSignedIn(false)});
    return()=>{alive=false};
  },[]);
  const destination=signedIn?"/dashboard":"/";
  return <div className="legalTop">
    <Link href={destination}>{signedIn?"← Back to NIVORA":"← Home"}</Link>
    <Link href={destination} className="osLogo">NIVORA<span>.</span></Link>
  </div>;
}
