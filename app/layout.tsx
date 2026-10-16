import "./auryn-redesign.css";
import "./research-redesign.css";
import "./portfolio-redesign.css";
import "./secondary-redesign.css";
import "./weekly-structure.css";
import "./product-polish.css";
import "./portfolio-refinement.css";
import "./watchlist-refinement.css";
import "./valuation-workbench.css";
import "./evidence-surfaces.css";
import "./research-surfaces.css";
import "./product-recovery.css";
import type {Metadata,Viewport} from "next";
import ThemeProvider from "@/components/ThemeProvider";

const description="AURYN turns market evidence into clear, explainable investment decisions and portfolio intelligence.";

export const metadata:Metadata={
 metadataBase:new URL("https://getauryn.vercel.app"),
 title:{default:"AURYN — Investment Intelligence",template:"%s | AURYN"},
 description,
 applicationName:"AURYN",
 icons:{icon:[{url:"/auryn-icon.svg",type:"image/svg+xml"}],shortcut:"/auryn-icon.svg",apple:"/auryn-apple.png"},
 manifest:"/manifest.webmanifest",
 appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"AURYN"},
 openGraph:{type:"website",siteName:"AURYN",title:"AURYN — Investment Intelligence",description,images:[{url:"/auryn-512.png",width:512,height:512,alt:"AURYN"}]},
 twitter:{card:"summary",title:"AURYN — Investment Intelligence",description,images:["/auryn-512.png"]},
};

export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#071321"};
const appearanceBoot=`(function(){try{var t=localStorage.getItem('auryn-theme')||'light';if(['noir','sapphire'].includes(t))t='dark';if(!['light','dark','system'].includes(t))t='light';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.dataset.accent=localStorage.getItem('auryn-accent')||'blue';}catch(e){}})();`;
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:appearanceBoot}}/></head><body><ThemeProvider>{children}</ThemeProvider></body></html>}