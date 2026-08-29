import "./globals.css";
import type { Metadata, Viewport } from "next";
export const metadata:Metadata={title:{default:"NIVORA — Market Intelligence",template:"%s | NIVORA"},description:"NIVORA synthesizes business, market, catalyst, technical and derivatives evidence into one explainable decision framework.",applicationName:"NIVORA",icons:{icon:"/icon.svg",shortcut:"/icon.svg",apple:"/icon.svg"},manifest:"/manifest.webmanifest",appleWebApp:{capable:true,statusBarStyle:"default",title:"NIVORA"},openGraph:{title:"NIVORA — Market Intelligence",description:"Complex market evidence. One explainable decision.",type:"website"}};
export const viewport:Viewport={width:"device-width",initialScale:1,maximumScale:1,viewportFit:"cover",themeColor:"#ffffff"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
