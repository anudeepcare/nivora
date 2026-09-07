import type {PrimaryInvestmentAction} from "@/lib/auryn/v4/domain";
import {formatInvestmentAction} from "@/lib/auryn/v4/presentation";

const tone=(x:string)=>/BUY|STRONG|IMPROV|LEADING|SUPPORT/.test(x.toUpperCase())?"good":/SELL|REDUCE|WEAK|POOR|HIGH RISK|DETERIOR/.test(x.toUpperCase())?"bad":"mid";

export default function StockTabContext({label,title,score,state,action,detail}:{label:string;title:string;score?:number|null;state?:string|null;action?:PrimaryInvestmentAction|null;detail:string}){
  return <header className="aurynTabContext">
    <div><small>{label}</small><h3>{title}</h3><p>{detail}</p></div>
    <div className="aurynTabContextState">
      {score!=null&&Number.isFinite(Number(score))?<><small>FACTOR</small><b>{Math.round(Number(score))}/100</b></>:<><small>FACTOR</small><b>N/A</b></>}
      {state&&<span className={tone(state)}>{state.replaceAll("_"," ")}</span>}
      {action&&<em>AURYN {formatInvestmentAction(action)}</em>}
    </div>
  </header>;
}
