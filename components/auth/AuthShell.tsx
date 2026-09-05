import {CheckCircle2,ShieldCheck} from "lucide-react";
import AurynLogo from "@/components/AurynLogo";
export default function AuthShell({eyebrow,title,subtitle,storyTitle,storyBody,points,children}:{eyebrow:string;title:string;subtitle:string;storyTitle:string;storyBody:string;points:string[];children:React.ReactNode}){
 return <main className="aurynAuthPage"><section className="aurynAuthShell">
  <aside className="aurynAuthStory"><AurynLogo href="/"/><div className="aurynEyebrow">{eyebrow}</div><h2>{storyTitle}</h2><p>{storyBody}</p><ul>{points.map((x,i)=><li key={x}>{i===points.length-1?<ShieldCheck size={16}/>:<CheckCircle2 size={16}/>}<span>{x}</span></li>)}</ul><div className="aurynAuthLegal">Research and decision-support only. No guaranteed outcomes. Market and model outputs can be delayed, incomplete or wrong.</div></aside>
  <div className="aurynAuthPanel"><div className="aurynEyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p>{children}</div>
 </section></main>
}