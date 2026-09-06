import "./globals.css";
import "./auryn-tokens.css";
import "./auryn-product.css";
import type {Metadata,Viewport} from "next";

const description="AURYN turns market evidence into clear, explainable investment decisions and portfolio intelligence.";

export const metadata:Metadata={
 metadataBase:new URL("https://getauryn.vercel.app"),
 title:{default:"AURYN — Investment Intelligence",template:"%s | AURYN"},
 description,
 applicationName:"AURYN",
 icons:{icon:[{url:"/auryn-v38-icon.svg",type:"image/svg+xml"}],shortcut:"/auryn-v38-icon.svg",apple:"/auryn-v38-apple.png"},
 manifest:"/manifest.webmanifest",
 appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"AURYN"},
 openGraph:{type:"website",siteName:"AURYN",title:"AURYN — Investment Intelligence",description,images:[{url:"/auryn-v38-512.png",width:512,height:512,alt:"AURYN"}]},
 twitter:{card:"summary",title:"AURYN — Investment Intelligence",description,images:["/auryn-v38-512.png"]},
};

export const viewport:Viewport={width:"device-width",initialScale:1,maximumScale:1,viewportFit:"cover",themeColor:"#15130f"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
