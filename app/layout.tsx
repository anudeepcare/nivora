import AnalyticsConsent from "@/components/AnalyticsConsent";
import { SITE_URL } from "@/lib/site-metadata";
import { AppearanceSync } from "@/components/AppearanceControls";
import Pwa from "@/components/Pwa";
import AppSession from "@/components/AppSession";
import type { Metadata, Viewport } from "next";
import "./core/compatibility.css";
import "./core/foundation.css";
import "./appearance.css";
import "./core/surfaces.css";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  robots: { index: false, follow: false },
  title: "AURYN · Investment Intelligence",
  description: "Understand the business. Put the price in perspective.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AURYN",
    statusBarStyle: "default",
  },
  icons: { icon: "/icon.svg?v=citron-20261104", apple: "/apple-touch-icon.png?v=citron-20261104" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#24272b" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8f5" },
  ],
};
const boot = `try{const x=JSON.parse(localStorage.getItem('auryn-appearance-v4')||JSON.stringify({accent:'blue',density:JSON.parse(localStorage.getItem('auryn-appearance-v1')||'{}').density}));document.documentElement.dataset.accent=['blue','teal','violet','rose'].includes(x.accent)?x.accent:'blue';document.documentElement.dataset.density=x.density==='compact'?'compact':'comfortable'}catch(e){};try{document.documentElement.dataset.pwa=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true?'true':'false'}catch(e){};try{const r=document.documentElement,s=localStorage.getItem('auryn-product-theme');r.dataset.theme=s==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s==='dark'?'dark':'light';r.dataset.textSize=localStorage.getItem('auryn-product-text')==='large'?'large':'standard';r.dataset.motion=localStorage.getItem('auryn-product-motion')==='reduce'?'reduce':'system'}catch(e){}`;
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
