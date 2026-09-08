import type {BusinessModel,FactorAssessment,SecurityClassification} from '../v4/domain';

export type ValuationMethod='DCF_FCF_EARNINGS'|'GROWTH_EV_SALES_FCF'|'CYCLE_NORMALIZED'|'AI_INFRA_SOTP_CAPACITY'|'FRONTIER_SCENARIO_RUNWAY'|'BANK_PB_ROE_NIM'|'REIT_FFO_AFFO'|'BIOTECH_SCENARIO_PIPELINE'|'ENERGY_CYCLE_NAV'|'GENERAL_RELATIVE';
export interface ValuationMethodAssessment{method:ValuationMethod;state:'MEASURED'|'PARTIAL'|'UNAVAILABLE';score:number|null;decisionGrade:boolean;requiredInputs:string[];explanation:string;}

const methodFor=(m:BusinessModel):ValuationMethod=>{
  if(['SAAS_SOFTWARE','MARKETPLACE_ADTECH','FINTECH_PAYMENTS'].includes(m))return'GROWTH_EV_SALES_FCF';
  if(m==='SEMICONDUCTOR_MEMORY_CYCLICAL')return'CYCLE_NORMALIZED';
  if(['AI_DATA_CENTER_INFRA','POWER_UTILITY_INFRA','NETWORKING_COMPUTE_INFRA'].includes(m))return'AI_INFRA_SOTP_CAPACITY';
  if(m==='SPACE_SATELLITE')return'FRONTIER_SCENARIO_RUNWAY';
  if(m==='BANK'||m==='INSURER')return'BANK_PB_ROE_NIM';
  if(m==='REIT')return'REIT_FFO_AFFO';
  if(m==='BIOTECH_PHARMA'||m==='MEDTECH')return'BIOTECH_SCENARIO_PIPELINE';
  if(m==='ENERGY'||m==='MINER_COMMODITY')return'ENERGY_CYCLE_NAV';
  if(['GENERAL_COMPOUNDER','CONSUMER','INDUSTRIAL','SEMICONDUCTOR_DESIGNER','DEFENSE'].includes(m))return'DCF_FCF_EARNINGS';
  return'GENERAL_RELATIVE';
};

const requirements:Record<ValuationMethod,string[]>={
  DCF_FCF_EARNINGS:['forward earnings or free cash flow','normalized margins','net cash/debt','reasonable terminal growth assumptions'],
  GROWTH_EV_SALES_FCF:['forward revenue','growth rate','gross/FCF margin trajectory','enterprise value/net cash'],
  CYCLE_NORMALIZED:['cycle-normalized earnings','inventory/pricing cycle','mid-cycle margins','net cash/debt'],
  AI_INFRA_SOTP_CAPACITY:['contracted/installed capacity','revenue or EBITDA per capacity unit','capex/funding needs','contract duration/customer quality','net debt/dilution'],
  FRONTIER_SCENARIO_RUNWAY:['commercial milestone probabilities','cash runway','funding/dilution needs','TAM/unit economics','scenario outcomes'],
  BANK_PB_ROE_NIM:['book value','ROE/ROTCE','net interest margin','credit quality','capital ratios'],
  REIT_FFO_AFFO:['FFO/AFFO','NAV','occupancy/rent growth','debt maturity/cost','cap rates'],
  BIOTECH_SCENARIO_PIPELINE:['pipeline milestone probabilities','cash runway','addressable market','dilution/funding','commercial economics'],
  ENERGY_CYCLE_NAV:['normalized commodity assumptions','asset NAV','mid-cycle cash flow','capex','net debt'],
  GENERAL_RELATIVE:['forward earnings/cash flow','peer multiples','historical range','balance sheet'],
};

const explanationFor=(method:ValuationMethod)=>({
  DCF_FCF_EARNINGS:'Mature/quality businesses should be valued primarily through forward earnings, free cash flow and DCF-style normalized economics.',
  GROWTH_EV_SALES_FCF:'Growth/software valuation should combine EV/Sales with growth durability and the path to free-cash-flow margins.',
  CYCLE_NORMALIZED:'Memory/cyclical valuation should use mid-cycle economics rather than peak or trough earnings in isolation.',
  AI_INFRA_SOTP_CAPACITY:'AI/power infrastructure valuation should use a sum-of-the-parts framework across capacity, contracts, unit economics, capex, financing and dilution.',
  FRONTIER_SCENARIO_RUNWAY:'Frontier/pre-scale valuation should be scenario-based and explicitly include milestone probability, runway and dilution risk.',
  BANK_PB_ROE_NIM:'Bank/financial valuation should center on book value, ROE/ROTCE, NIM, credit quality and capital strength.',
  REIT_FFO_AFFO:'REIT valuation should use FFO/AFFO, NAV, cap rates, occupancy and financing conditions rather than generic EPS multiples.',
  BIOTECH_SCENARIO_PIPELINE:'Biotech/pre-profit valuation should be pipeline/scenario based with runway and financing risk explicit.',
  ENERGY_CYCLE_NAV:'Energy/miner valuation should normalize commodity assumptions and combine asset NAV with mid-cycle cash flow and balance-sheet risk.',
  GENERAL_RELATIVE:'Use forward cash-flow/earnings economics, peer ranges and historical valuation while avoiding unsupported precision.'
}[method]);

export function resolveValuationMethod(classification:SecurityClassification,factor?:FactorAssessment):ValuationMethodAssessment{
  const method=methodFor(classification.businessModel);
  const score=factor?.available&&factor.score!=null&&Number.isFinite(factor.score)?Number(factor.score):null;
  if(score==null)return{method,state:'UNAVAILABLE',score:null,decisionGrade:false,requiredInputs:requirements[method],explanation:explanationFor(method)};
  const reason=String(factor?.reason||'');
  const preliminary=factor?.validationState!=='MEASURED'||/preliminary|not allowed|unsupported|unavailable|stale/i.test(reason);
  return{method,state:preliminary?'PARTIAL':'MEASURED',score,decisionGrade:!preliminary,requiredInputs:requirements[method],explanation:explanationFor(method)};
}
