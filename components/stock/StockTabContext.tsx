import type {PrimaryInvestmentAction} from "@/lib/auryn/v4/domain";
import type {InstitutionalNewMoneyAction} from "@/lib/auryn/v931/domain";

const tone=(x:string)=>/BUY|STRONG|IMPROV|LEADING|SUPPORT/.test(x.toUpperCase())?"good":/SELL|REDUCE|WEAK|POOR|HIGH RISK|DETERIOR/.test(x.toUpperCase())?"bad":"mid";

export default function StockTabContext({label,title,score,state,action,detail,marketTruth}:{label:string;title:string;score?:number|null;state?:string|null;action?:PrimaryInvestmentAction|InstitutionalNewMoneyAction|null;detail:string;marketTruth?:any}){
  const blocked=marketTruth?.priceSensitiveAllowed===false;
  return <header className="aurynTabContext">
    <div><small>{label}</small><h3>{title}</h3><p>{detail}</p>{blocked&&<p className="aurynTabMarketGate"><b>PRICE UNVERIFIED</b> · Structural research remains visible; price-sensitive timing is temporarily blocked.</p>}</div>
    <div className="aurynTabContextState">
      {score!=null&&Number.isFinite(Number(score))?<><small>FACTOR</small><b>{Math.round(Number(score))}/100</b></>:<><small>FACTOR</small><b>N/A</b></>}
      {state&&<span className={tone(state)}>{state.replaceAll("_"," ")}</span>}
      {action&&<em>AURYN {action.replaceAll("_"," ")}</em>}
    </div>
  </header>;
}
