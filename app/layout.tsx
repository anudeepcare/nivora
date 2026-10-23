import {AppearanceSync} from "@/components/AppearanceControls";
import Pwa from "@/components/Pwa";
import AppSession from "@/components/AppSession";
import type { Metadata, Viewport } from "next";
import "./studio-foundation.css";
import "./globals.css";
import "./decision-workspace.css";
import "./appearance.css";
import "./connected-product.css";
import "./portfolio.css";
import "./interaction.css";
import "./evidence-product.css";
import "./public-site.css";
import "./overview-visual.css";
import "./funded-scenarios.css";
import "./product-surfaces.css";
import "./research-desks.css";
import "./approved-entry.css";
import "./approved-home.css";
import "./membership.css";
import "./options.css";
import "./pwa-shell.css";
export const metadata: Metadata = {
  title: "AURYN · Investment Intelligence",
  description: "Understand the business. Put the price in perspective.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AURYN",
    statusBarStyle: "default",
  },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#171b24" },
    { media: "(prefers-color-scheme: light)", color: "#f2f4f7" },
  ],
};
const boot = `try{const x=JSON.parse(localStorage.getItem('auryn-appearance-v1')||'{}');document.documentElement.dataset.accent=['blue','teal','violet','rose'].includes(x.accent)?x.accent:'blue';document.documentElement.dataset.density=x.density==='compact'?'compact':'comfortable'}catch(e){};try{document.documentElement.dataset.pwa=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true?'true':'false'}catch(e){};try{const r=document.documentElement,s=localStorage.getItem('auryn-product-theme');r.dataset.theme=s==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s==='dark'?'dark':'light';r.dataset.textSize=localStorage.getItem('auryn-product-text')==='large'?'large':'standard';r.dataset.motion=localStorage.getItem('auryn-product-motion')==='reduce'?'reduce':'system'}catch(e){}`;
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body id="auryn-app">
        <div className="pwa-status-surface" aria-hidden="true" />
        <Pwa />
        <AppearanceSync />
        <AppSession>{children}</AppSession>
      </body>
    </html>
  );
}
