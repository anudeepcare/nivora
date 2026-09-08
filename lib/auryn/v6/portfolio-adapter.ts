import type {PrimaryInvestmentAction} from '../v4/domain';
import type {PortfolioRisk} from '../../nivora-portfolio-risk';
import {applyPortfolioCioOverlay} from './portfolio-cio';

export interface PortfolioCioPositionInput{
  symbol:string;
  value:number;
  archetype?:string|null;
  rawAction?:string|null;
  assetType?:'EQUITY'|'CRYPTO'|'CASH'|string;
}

export interface PortfolioCioVisibleAction{
  symbol:string;
  portfolioAction:'ADD'|'HOLD'|'WATCH'|'TRIM_RISK';
  companyAction:PrimaryInvestmentAction;
  weightPct:number;
  reason:string;
  maxNewPositionPct:number;
  constrained:boolean;
}

export function normalizePortfolioCompanyAction(raw:string|null|undefined):PrimaryInvestmentAction{
  const x=String(raw||'').trim().toUpperCase();
  if(/EXIT|SELL/.test(x))return 'SELL';
  if(/REDUCE|TRIM/.test(x))return 'REDUCE';
  if(/STRONG\s*BUY/.test(x))return 'STRONG_BUY';
  if(/BUY|ADD|ACCUMULATE/.test(x))return 'BUY';
  if(/INSUFFICIENT/.test(x))return 'INSUFFICIENT_EVIDENCE';
  return 'HOLD';
}

const visibleAction=(x:'ADD'|'HOLD'|'REDUCE_EXPOSURE'|'BLOCK_ADD'):
  PortfolioCioVisibleAction['portfolioAction']=>x==='ADD'?'ADD':x==='REDUCE_EXPOSURE'?'TRIM_RISK':x==='BLOCK_ADD'?'WATCH':'HOLD';

export function buildPortfolioCioActions({positions,portfolioRisk}:{positions:PortfolioCioPositionInput[];portfolioRisk:PortfolioRisk;}):PortfolioCioVisibleAction[]{
  const funded=positions.filter(x=>String(x.assetType||'EQUITY').toUpperCase()!=='CASH'&&Number.isFinite(Number(x.value))&&Number(x.value)>0);
  const total=positions.reduce((s,x)=>s+(Number.isFinite(Number(x.value))&&Number(x.value)>0?Number(x.value):0),0);
  const archetypeValue=new Map<string,number>();
  for(const p of funded){const key=String(p.archetype||'').trim();if(key)archetypeValue.set(key,(archetypeValue.get(key)||0)+Number(p.value));}
  const priority:Record<PortfolioCioVisibleAction['portfolioAction'],number>={ADD:0,WATCH:1,TRIM_RISK:2,HOLD:3};
  return funded.map(p=>{
    const weightPct=total>0?Number(p.value)/total*100:0;
    const archetype=String(p.archetype||'').trim();
    const sameArchetypeExposurePct=archetype&&total>0?(archetypeValue.get(archetype)||0)/total*100:0;
    const companyAction=normalizePortfolioCompanyAction(p.rawAction);
    const overlay=applyPortfolioCioOverlay({independentAction:companyAction,portfolioRisk,owns:true,currentPositionPct:weightPct,sameArchetypeExposurePct});
    return{symbol:p.symbol,portfolioAction:visibleAction(overlay.portfolioAction),companyAction:overlay.companyAction,weightPct:+weightPct.toFixed(1),reason:overlay.reasons[0]||'Portfolio context reviewed.',maxNewPositionPct:overlay.maxNewPositionPct,constrained:overlay.constrained};
  }).sort((a,b)=>priority[a.portfolioAction]-priority[b.portfolioAction]);
}
