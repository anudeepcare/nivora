import type {Horizon,PrimaryInvestmentAction} from "./domain";

export function formatInvestmentAction(action:PrimaryInvestmentAction){
  return action.replaceAll("_"," ");
}

export function horizonLabel(horizon:Horizon){
  return horizon==="NOW"?"NOW":horizon==="SWING"?"SWING":horizon==="SIX_TO_TWELVE_MONTHS"?"6–12M":"3–5Y";
}

export function explainReasonCode(code:string){
  const reasons:Record<string,string>={
    LONG_TERM_THESIS_STRONG:"The long-term thesis is supported by strong slow-moving business evidence.",
    TECHNICAL_WEAKNESS_LIMITS_TIMING:"Technical weakness limits near-term timing, but does not by itself invalidate the long-term thesis.",
    VALUATION_CAPS_NEW_RISK:"Valuation is demanding enough to cap how aggressively new capital should be deployed.",
    RISK_CAP_ACTIVE:"Risk is elevated enough to prevent a more aggressive buy decision.",
    MODEL_SUITABILITY_CAP:"AURYN has reduced conviction because this security does not fit the selected analyst model strongly enough.",
    THESIS_BROKEN:"The underlying investment thesis has broken; cheap valuation or strong price action does not override that deterioration.",
    HARD_VETO_GOVERNANCE:"A governance or integrity veto overrides otherwise positive evidence.",
    HARD_VETO_SOLVENCY:"Solvency or financing risk overrides otherwise positive evidence.",
    CRITICAL_EVIDENCE_MISSING:"Required decision evidence is missing. AURYN will not manufacture a confident buy or sell call.",
    MULTI_HORIZON_CONVICTION:"Business quality, opportunity, risk and timing align across multiple horizons.",
    MULTI_HORIZON_RESOLUTION:"AURYN resolved conflicting business, valuation, risk and timing evidence into the current action."
  };
  return reasons[code]??"AURYN resolved the available evidence into the current action.";
}

export function ownerGuidance(action:PrimaryInvestmentAction){
  if(action==="STRONG_BUY"||action==="BUY")return "HOLD / ADD";
  if(action==="HOLD")return "HOLD";
  if(action==="REDUCE")return "REDUCE";
  if(action==="SELL")return "SELL / EXIT";
  return "HOLD / VERIFY";
}

export function newMoneyGuidance(action:PrimaryInvestmentAction){
  if(action==="STRONG_BUY")return "STRONG BUY";
  if(action==="BUY")return "BUY";
  if(action==="HOLD")return "HOLD / DO NOT CHASE";
  if(action==="REDUCE"||action==="SELL")return "AVOID NEW CAPITAL";
  return "DO NOT ADD / VERIFY";
}
