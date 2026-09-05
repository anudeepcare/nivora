import Link from "next/link";
import AurynLogo from "@/components/AurynLogo";

export default function ProductFooter({compact=false}:{compact?:boolean}){
 return <footer className={`aurynProductFooter ${compact?"compact":""}`}>
  <div className="aurynProductFooterInner">
   <div className="aurynProductFooterBrand"><AurynLogo href="/" compact/><p>Decision-support research for investors who want the call, the evidence and what would change it.</p></div>
   <nav aria-label="AURYN information">
    <div><small>PRODUCT</small><Link href="/about">About</Link><Link href="/methodology">Methodology</Link><Link href="/faq">FAQ</Link></div>
    <div><small>LEGAL</small><Link href="/terms">Terms of Use</Link><Link href="/privacy">Privacy Policy</Link><Link href="/disclaimer">Risk Disclosure</Link></div>
   </nav>
  </div>
  <div className="aurynProductFooterBottom"><span>© 2026 AURYN</span><span>Research and decision-support only. Investing involves risk. No guaranteed outcomes.</span></div>
 </footer>
}