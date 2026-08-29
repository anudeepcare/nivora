import Link from "next/link";
import {ArrowLeft,Info,ShieldCheck,Activity,Newspaper,BriefcaseBusiness} from "lucide-react";
export default function About(){
 return <div className="osSimplePage v20About">
  <Link href="/dashboard" className="v19NavBack"><ArrowLeft size={15}/> Today</Link>
  <small>ABOUT NIVORA</small><h1>Make the market easier to understand.</h1>
  <p className="lead">NIVORA turns market, business, technical, catalyst and risk evidence into a plain-English decision framework. It is built to help a beginner understand <b>what the evidence says, why it says it, and what would change the call.</b></p>
  <div className="v20AboutGrid">
   <section><BriefcaseBusiness/><h2>Business</h2><p>Multi-year financial quality, growth, profitability and consistency when standardized data is available.</p></section>
   <section><Activity/><h2>Timing</h2><p>Trend, momentum, structure, volume, support/resistance, extension and relative strength help judge whether today's price is attractive.</p></section>
   <section><Newspaper/><h2>Catalysts</h2><p>Earnings, filings and material news are kept separate from the core score so a headline cannot silently dominate the decision.</p></section>
   <section><ShieldCheck/><h2>Risk first</h2><p>High-quality businesses can still have poor entries. NIVORA explicitly shows better-entry, confirmation and reassessment levels.</p></section>
  </div>
  <section className="v20Method"><Info/><div><h2>How to read NIVORA</h2><p>Start with <b>The Call</b>. Then read the reason and mapped levels. Use the score as supporting evidence—not as an automatic buy signal. Open Fundamentals, Catalysts, News, Earnings and Technical only when you want the evidence underneath.</p></div></section>
  <p className="fine">NIVORA is research and decision support, not individualized investment advice or a guarantee of performance. <Link href="/disclaimer">Full disclaimer</Link>.</p>
 </div>
}