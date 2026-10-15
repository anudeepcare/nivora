"use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {BriefcaseBusiness,FlaskConical,LogOut,Radar,Search as SearchIcon,UserRound,Bookmark,Settings2,HelpCircle} from "lucide-react";
import {supabaseBrowser} from "@/lib/supabase";
import AurynLogo from "./AurynLogo";
import SearchBox from "./SearchBox";
import ProductFooter from "./ProductFooter";

const nav=[
 {href:"/analyze",label:"Research",icon:SearchIcon},
 {href:"/portfolio",label:"Portfolio",icon:BriefcaseBusiness},
 {href:"/alerts",label:"Monitor",icon:Radar},
 {href:"/trading-lab",label:"Trading Lab",icon:FlaskConical},
];

export default function AppShell({children}:{children:React.ReactNode}){
 const path=usePathname(),router=useRouter(),menuRef=useRef<HTMLDivElement>(null);
 const[open,setOpen]=useState(false),[email,setEmail]=useState(""),[primarySearchVisible,setPrimarySearchVisible]=useState(path==="/analyze");
 const active=(href:string)=>path===href||path.startsWith(href+"/")||(href==="/analyze"&&path.startsWith("/stock/"));
 useEffect(()=>{
  const sb=supabaseBrowser();sb.auth.getSession().then(({data})=>setEmail(data.session?.user.email||""));
  const close=(e:MouseEvent)=>{if(menuRef.current&&!menuRef.current.contains(e.target as Node))setOpen(false)};
  document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close);
 },[]);
 useEffect(()=>{setOpen(false)},[path]);
 useEffect(()=>{
  if(path!=="/analyze"){setPrimarySearchVisible(false);return}
  let observer:IntersectionObserver|null=null;const timer=window.setTimeout(()=>{const el=document.querySelector(".aurynResearchHero .aurynSearch.large");if(!el){setPrimarySearchVisible(false);return}observer=new IntersectionObserver(([entry])=>setPrimarySearchVisible(entry.isIntersecting),{threshold:.35});observer.observe(el)},50);
  return()=>{window.clearTimeout(timer);observer?.disconnect()};
 },[path]);
 async function logout(){await supabaseBrowser().auth.signOut();router.replace("/login");router.refresh()}
 return <div className="aurynAppShell">
  <header className="aurynHeader">
   <AurynLogo compact/>
   <nav className="aurynDesktopNav" aria-label="Primary">{nav.map(n=><Link key={n.href} className={active(n.href)?"on":""} href={n.href}>{n.label}</Link>)}</nav>
   <div className="aurynHeaderRight">
    <div className="aurynQuickSearch"><SearchBox compact/></div>
    <div className="aurynAccount" ref={menuRef}>
     <button type="button" aria-label="Account menu" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{(email?.[0]||"A").toUpperCase()}</button>
     {open&&<div className="aurynAccountMenu"><small>{email||"AURYN account"}</small><Link href="/profile"><UserRound size={15}/>Profile</Link><button onClick={logout}><LogOut size={15}/>Sign out</button></div>}
    </div>
   </div>
  </header>
  {(!primarySearchVisible||path!=="/analyze")&&<div className="aurynMobileSearch"><SearchBox compact/></div>}
  <div className="aurynOSWorkspace">
   <aside className="aurynOSSidebar" aria-label="Workspace navigation">
    <div className="aurynOSSidebarLabel">WORKSPACE</div>
    {nav.map(n=>{const Icon=n.icon;return <Link key={n.href} href={n.href} className={active(n.href)?"aurynOSNavLink active":"aurynOSNavLink"}><Icon size={19}/><span>{n.label}</span></Link>})}
    <Link href="/watchlist" className={active("/watchlist")?"aurynOSNavLink active":"aurynOSNavLink"}><Bookmark size={19}/>Watchlist</Link>
    <div className="aurynOSSidebarBottom"><Link href="/profile" className="aurynOSNavLink"><Settings2 size={19}/>Settings</Link><Link href="/about" className="aurynOSNavLink"><HelpCircle size={19}/>About AURYN</Link></div>
   </aside>
   <main className="aurynAppMain">{children}</main>
  </div>
  <ProductFooter/>
  <nav className="aurynBottomNav" aria-label="Mobile primary">{nav.map(n=>{const Icon=n.icon;return <Link key={n.href} className={active(n.href)?"on":""} href={n.href}><Icon size={20}/><span>{n.label}</span></Link>})}</nav>
 </div>
}