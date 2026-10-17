import Pwa from "@/components/Pwa";
import type { Metadata, Viewport } from "next";
import "./approved-design.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "AURYN · Investment Intelligence",
  description: "Understand the business. Put the price in perspective.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "AURYN", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e1420" },
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
  ],
};
const boot = `try{const r=document.documentElement,s=localStorage.getItem('auryn-product-theme');r.dataset.theme=s==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s==='light'?'light':'dark';r.dataset.textSize=localStorage.getItem('auryn-product-text')==='large'?'large':'standard';r.dataset.motion=localStorage.getItem('auryn-product-motion')==='reduce'?'reduce':'system'}catch(e){}`;
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body id="auryn-app">
        <Pwa />
        {children}
      </body>
    </html>
  );
}
