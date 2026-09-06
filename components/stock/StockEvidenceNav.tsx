"use client";
const primary=[['thesis','Thesis'],['fundamentals','Business'],['earnings','Earnings'],['technical','Technicals']] as const;
const secondary=[['institutions','Ownership'],['catalysts','Catalysts'],['options','Options']] as const;
export default function StockEvidenceNav({tab,setTab,isCrypto}:{tab:string;setTab:(x:any)=>void;isCrypto:boolean}){
 const p=primary.filter(([k])=>!(isCrypto&&k==='earnings'));
 const s=secondary.filter(([k])=>!(isCrypto&&k==='institutions'));
 const btn=(k:string,label:string)=><button key={k} type="button" className={tab===k?"on":""} onClick={()=>setTab(k)}>{label}</button>;
 return <nav className="aurynEvidenceNav" aria-label="Analysis evidence"><div className="aurynEvidencePrimary">{p.map(([k,l])=>btn(k,l))}</div><div className="aurynEvidenceSecondaryDesktop">{s.map(([k,l])=>btn(k,l))}</div><details className="aurynEvidenceMore"><summary>More</summary><div>{s.map(([k,l])=>btn(k,l))}</div></details></nav>
}
