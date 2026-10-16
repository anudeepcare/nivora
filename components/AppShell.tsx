"use client";
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Sun,Compass,BriefcaseBusiness,Bookmark,Search,Bell,FlaskConical,Settings,HelpCircle,LogOut,UserRound,X,BookOpen} from 'lucide-react';
import AurynLogo from './AurynLogo';
import SearchBox from './SearchBox';
import {supabaseBrowser} from '@/lib/supabase';
const main=[{href:'/dashboard',label:'Today',icon:Sun},{href:'/discover',label:'Discover',icon:Compass},{href:'/portfolio',label:'Portfolio',icon:BriefcaseBusiness},{href:'/watchlist',label:'Saved',icon:Bookmark}];
const tools=[{href:'/analyze',label:'Research',icon:Search},{href:'/alerts',label:'Alerts',icon:Bell},{href:'/trading-lab',label:'Paper trading',icon:FlaskConical}];
export default function AppShell({children}:{children:React.ReactNode}){
 const path=usePathname(),menu=useRef<HTMLDivElement>(null),[open,setOpen]=useState(false),[email,setEmail]=useState('');
 const active=(href:string)=>path===href||(href==='/analyze'&&path.startsWith('/stock/'));
 useEffect(()=>{let alive=true;try{supabaseBrowser().auth.getSession().then(({data})=>{if(alive)setEmail(data.session?.user.email||'')}).catch(()=>{});}catch{}const close=(e:MouseEvent)=>{if(menu.current&&!menu.current.contains(e.target as Node))setOpen(false);},escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('mousedown',close);document.addEventListener('keydown',escape);return()=>{alive=false;document.removeEventListener('mousedown',close);document.removeEventListener('keydown',escape)}},[]);
 useEffect(()=>setOpen(false),[path]);
 async function logout(){try{const {error}=await supabaseBrowser().auth.signOut();if(error)throw error;window.location.assign('/login');}catch{window.alert('Sign out failed. Please try again.')}}
 const item=(x:typeof main[number])=>{const Icon=x.icon;return <Link href={x.href} key={x.href} className={active(x.href)?'on':''} aria-current={active(x.href)?'page':undefined}><Icon size={20}/><span>{x.label}</span></Link>};
 return <div className={`aurynAppShell aurynClearProduct${path.startsWith('/stock/')?' aurynStockWorkspace':''}`}><a className="uxSkip" href="#workspace">Skip to content</a>
 <aside className="aurynSidebar"><AurynLogo compact/><nav aria-label="Desktop primary">{main.map(item)}</nav><span className="aurynSidebarLabel">TOOLS</span><nav aria-label="Research tools">{tools.map(item)}</nav><div className="aurynSidebarBottom"><Link href="/personalization"><Settings size={18}/>Appearance</Link><Link href="/faq"><HelpCircle size={18}/>Help</Link><Link href="/methodology"><BookOpen size={18}/>Methodology</Link></div></aside>
 <div className="aurynWorkspace"><header className="aurynHeader"><div className="aurynHeaderBrand"><AurynLogo compact/></div><div className="aurynQuickSearch"><SearchBox compact/></div><div className="aurynHeaderRight"><Link className="uxWatchShortcut" href="/alerts" aria-label="Research alerts"><Bell size={20}/></Link><div className="aurynAccount" ref={menu}><button aria-label="Account menu" aria-expanded={open} aria-controls="account-menu" onClick={()=>setOpen(!open)}>{open?<X size={18}/>:(email[0]||'A').toUpperCase()}</button>{open&&<div className="aurynAccountMenu" id="account-menu"><small>{email||'Your account'}</small><Link href="/profile"><UserRound size={16}/>Account</Link>{tools.map(item)}<Link href="/personalization"><Settings size={16}/>Appearance</Link><Link href="/faq"><HelpCircle size={16}/>Help</Link><button onClick={logout}><LogOut size={16}/>Sign out</button></div>}</div></div></header>
 <main className="aurynAppMain" id="workspace">{children}</main><footer className="uxAppFooter"><span>AURYN</span><Link href="/disclaimer">Research only · Investing involves risk</Link></footer></div>
 <nav className="aurynBottomNav" aria-label="Mobile primary">{main.map(item)}</nav></div>;
}
