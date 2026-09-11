"use client";
const tabs=[['thesis','Overview'],['fundamentals','Business'],['earnings','Earnings'],['technical','Technicals'],['institutions','Ownership'],['catalysts','Catalysts'],['options','Options']] as const;
export default function StockEvidenceNav({tab,setTab,isCrypto}:{tab:string;setTab:(x:any)=>void;isCrypto:boolean}){
 const visible=tabs.filter(([k])=>!(isCrypto&&(k==='earnings'||k==='institutions')));
 return <nav className="aurynEvidenceNav" aria-label="Analysis evidence">{visible.map(([k,label])=><button key={k} type="button" className={tab===k?"on":""} onClick={()=>setTab(k)}>{label}</button>)}</nav>;
}
