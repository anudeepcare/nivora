import "./globals.css";
import "./v65-responsive.css";
import type { Metadata, Viewport } from "next";
export const metadata:Metadata={title:{default:"NIVORA — Investment Intelligence",template:"%s | NIVORA"},description:"NIVORA turns business, market, institutional, technical, catalyst and derivatives evidence into one clear, explainable investment decision.",applicationName:"NIVORA",icons:{icon:"/icon.svg",shortcut:"/icon.svg",apple:"/apple-touch-icon.png"},manifest:"/manifest.webmanifest",appleWebApp:{capable:true,statusBarStyle:"default",title:"NIVORA"},openGraph:{title:"NIVORA — Investment Intelligence",description:"Complex market evidence. One explainable decision.",type:"website"}};
export const viewport:Viewport={width:"device-width",initialScale:1,maximumScale:1,viewportFit:"cover",themeColor:"#ffffff"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
