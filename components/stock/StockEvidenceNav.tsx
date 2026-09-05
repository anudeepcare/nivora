const items=[["thesis","Thesis"],["fundamentals","Business"],["earnings","Earnings"],["institutions","Ownership"],["catalysts","Catalysts"],["technical","Technicals"],["options","Options"]] as const;
export default function StockEvidenceNav({tab,setTab,isCrypto}:{tab:string;setTab:(x:any)=>void;isCrypto:boolean}){
 return <nav className="aurynEvidenceNav" aria-label="Analysis evidence">{items.filter(([k])=>!(isCrypto&&(k==="earnings"||k==="institutions"))).map(([k,label])=><button key={k} type="button" className={tab===k?"on":""} onClick={()=>setTab(k)}>{label}</button>)}</nav>
}