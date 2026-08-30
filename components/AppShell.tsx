"use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {supabaseBrowser} from "@/lib/supabase";
import {useEffect,useRef,useState} from "react";
import {House,Search,Star,BriefcaseBusiness,UserRound,Bell,Settings,Info,ShieldCheck} from "lucide-react";

export default function AppShell({children}:{children:React.ReactNode}){
 const path=usePathname(),router=useRouter(),[open,setOpen]=useState(false),[email,setEmail]=useState(""),ref=useRef<HTMLDivElement>(null);
 const sb=supabaseBrowser();
 useEffect(()=>{sb.auth.getSession().then(({data})=>setEmail(data.session?.user.email||""));const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h)},[]);
 async function logout(){await sb.auth.signOut();router.replace("/login");router.refresh()}
 const active=(p:string)=>path===p||path.startsWith(p+"/");
 return <>
  <header className="osHeader v12Header">
   <Link className="osLogo v37Logo" href="/dashboard"><span className="v37Wordmark">NIVORA<span>.</span></span><small>Decision Intelligence</small></Link>
   <nav className="osDesktopNav" aria-label="Primary">
    <Link className={active("/dashboard")?"on":""} href="/dashboard">Radar</Link>
    <Link className={active("/analyze")||active("/stock")?"on":""} href="/analyze">Analyze</Link>
    <Link className={active("/watchlist")?"on":""} href="/watchlist">Watchlist</Link>
    <Link className={active("/portfolio")?"on":""} href="/portfolio">Portfolio</Link>
   </nav>
   <div className="osAccount" ref={ref}><button onClick={()=>setOpen(!open)} aria-label="Account">{(email?.[0]||"N").toUpperCase()}</button>{open&&<div className="osAccountMenu"><small>{email}</small><Link href="/profile"><UserRound size={14}/>Profile</Link><Link href="/alerts"><Bell size={14}/>Alerts</Link><Link href="/profile"><Settings size={14}/>Settings</Link><Link href="/about"><Info size={14}/>About NIVORA</Link><Link href="/faq"><Info size={14}/>FAQ</Link><Link href="/disclaimer"><ShieldCheck size={14}/>How to use / Disclaimer</Link><button onClick={logout}>Log out</button></div>}</div>
  </header>
  <main className="osMain v12Main">{children}</main>
  <nav className="osMobileNav v12MobileNav" aria-label="Mobile navigation">
   <Link className={active("/dashboard")?"on":""} href="/dashboard"><House size={19}/><span>Radar</span></Link>
   <Link className={active("/analyze")||active("/stock")?"on":""} href="/analyze"><Search size={19}/><span>Analyze</span></Link>
   <Link className={active("/watchlist")?"on":""} href="/watchlist"><Star size={19}/><span>Watchlist</span></Link>
   <Link className={active("/portfolio")?"on":""} href="/portfolio"><BriefcaseBusiness size={19}/><span>Portfolio</span></Link>
  </nav>
  <footer className="osLegalFooter"><div className="footerBrand"><b>NIVORA Intelligence</b><span>Complex market data. One clear decision.</span></div><div className="footerLinks"><span>© 2026 NIVORA</span><Link href="/about">About</Link><Link href="/faq">FAQ</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/disclaimer">Disclaimer</Link></div></footer>
 </>
}
