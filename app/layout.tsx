import AnalyticsConsent from "@/components/AnalyticsConsent";
import { SITE_URL } from "@/lib/site-metadata";
import { AppearanceSync } from "@/components/AppearanceControls";
import Pwa from "@/components/Pwa";
import AppSession from "@/components/AppSession";
import type { Metadata, Viewport } from "next";
import "./core/foundation.css";
import "./core/preferences.css";
import "./core/primitives.css";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  robots: { index: false, follow: false },
  title: "AURYN · Investment Intelligence",
  description: "Understand the business. Put the price in perspective.",
  manifest: "/manifest.webmanifest?v=20261115-approved-glass",
  appleWebApp: {
    capable: true,
    title: "AURYN",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg?v=approved-glass-20261115",
    apple: "/apple-touch-icon-v3.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#111b2c" },
    { media: "(prefers-color-scheme: light)", color: "#f4f8ff" },
  ],
};
const boot = `try{const x=JSON.parse(localStorage.getItem('auryn-appearance-v4')||JSON.stringify({accent:'blue',density:JSON.parse(localStorage.getItem('auryn-appearance-v1')||'{}').density}));document.documentElement.dataset.accent=['blue','teal','violet','rose'].includes(x.accent)?x.accent:'blue';document.documentElement.dataset.density=x.density==='compact'?'compact':'comfortable'}catch(e){};try{document.documentElement.dataset.pwa=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true?'true':'false'}catch(e){};try{const r=document.documentElement,s=localStorage.getItem('auryn-product-theme');r.dataset.theme=s==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s==='dark'?'dark':'light';r.style.colorScheme=r.dataset.theme;document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{m.content=r.dataset.theme==='dark'?'#111b2c':'#f4f8ff';m.removeAttribute('media')});r.dataset.textSize=localStorage.getItem('auryn-product-text')==='large'?'large':'standard';r.dataset.motion=localStorage.getItem('auryn-product-motion')==='reduce'?'reduce':'system'}catch(e){}`;
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body id="auryn-app">
        <div className="pwa-status-surface" aria-hidden="true" />
        <Pwa />
        <AppearanceSync />
        <AppSession>{children}</AppSession>
        <AnalyticsConsent />
      </body>
    </html>
  );
}
