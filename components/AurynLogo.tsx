"use client";
import Link from "next/link";
export default function AurynLogo({href="/analyze",compact=false}:{href?:string;compact?:boolean}){return <Link href={href} className={`aurynBrand ${compact?"compact":""}`} aria-label="AURYN home"><svg className="aurynSigil" viewBox="0 0 48 48" aria-hidden="true"><path d="M7 36.5 19.2 11h9.6L41 36.5h-8.7l-2.6-6H18.3l-2.6 6H7Zm14.2-13h5.6L24 17l-2.8 6.5Z"/><path className="aurynCut" d="M15 37 24 19l9 18h-5.3L24 29.7 20.3 37H15Z"/></svg><span className="aurynWord">AURYN</span>{!compact?<small>Investment Intelligence</small>:null}</Link>}
