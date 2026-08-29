import "./globals.css";
import type { Metadata, Viewport } from "next";
export const metadata:Metadata={title:"NIVORA — Market Intelligence",description:"Market intelligence, simplified.",appleWebApp:{capable:true,statusBarStyle:"default",title:"NIVORA"}};
export const viewport:Viewport={width:"device-width",initialScale:1,maximumScale:1,viewportFit:"cover",themeColor:"#ffffff"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
