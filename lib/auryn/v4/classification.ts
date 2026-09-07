import type {BusinessModel,EvidenceRef,LifecycleStage,SecurityClassification,SecurityClassificationInput} from "./domain";

const finite=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v);
const text=(x:SecurityClassificationInput)=>[x.name,x.description,x.sector,x.industry].filter(Boolean).join(" ").toLowerCase();

const rules:[BusinessModel,RegExp][]=[
  ["SPACE_SATELLITE",/satellite|constellation|direct[- ]to[- ]device|space[- ]based/],
  ["SEMICONDUCTOR_MEMORY_CYCLICAL",/\bdram\b|\bnand\b|memory semiconductor|memory producer/],
  ["SEMICONDUCTOR_DESIGNER",/fabless|semiconductor design|\bgpu\b|accelerator|chip designer/],
  ["NETWORKING_COMPUTE_INFRA",/networking silicon|ethernet|optical interconnect|switching|compute fabric/],
  ["AI_DATA_CENTER_INFRA",/ai cloud|gpu cloud|data cent(?:er|re)|accelerated compute|hyperscale/],
  ["POWER_UTILITY_INFRA",/utility|power generation|fuel cell|grid|electric power/],
  ["MARKETPLACE_ADTECH",/ad[- ]tech|advertising platform|marketplace|app monetization/],
  ["SAAS_SOFTWARE",/\bsaas\b|software platform|cloud software|subscription software/],
  ["FINTECH_PAYMENTS",/payments|fintech|merchant acquiring|digital wallet/],
  ["BIOTECH_PHARMA",/biotech|pharma|therapeutic|drug development/],
  ["MEDTECH",/medical device|medtech|diagnostic device/],
  ["MINER_COMMODITY",/mining|miner|copper producer|gold producer|lithium producer/],
  ["ENERGY",/\boil\b|\bgas\b|\blng\b|upstream|midstream|refining/],
  ["DEFENSE",/defense|aerospace systems|missile|military systems/],
  ["REIT",/\breit\b|real estate investment trust/],
  ["BANK",/\bbank\b|banking/],
  ["INSURER",/insurance|insurer/],
  ["CONSUMER",/consumer|retail|restaurant|beverage|apparel/],
  ["INDUSTRIAL",/industrial|machinery|logistics equipment|automation/]
];

function classifyBusinessModel(input:SecurityClassificationInput){
  const t=text(input);
  for(const [model,re] of rules){if(re.test(t))return{model,specific:true};}
  const industry=(input.industry||"").toLowerCase();
  const sector=(input.sector||"").toLowerCase();
  if(industry.includes("software"))return{model:"SAAS_SOFTWARE" as BusinessModel,specific:true};
  if(industry.includes("semiconductor"))return{model:"SEMICONDUCTOR_DESIGNER" as BusinessModel,specific:true};
  if(sector.includes("financial"))return{model:"BANK" as BusinessModel,specific:true};
  if(sector.includes("real estate"))return{model:"REIT" as BusinessModel,specific:true};
  if(sector.includes("health")&&industry.includes("biotech"))return{model:"BIOTECH_PHARMA" as BusinessModel,specific:true};
  return{model:"GENERAL_COMPOUNDER" as BusinessModel,specific:false};
}

function lifecycleOf(x:SecurityClassificationInput,businessModel:BusinessModel):LifecycleStage{
  const rev=finite(x.revenue)?Number(x.revenue):null;
  const growth=finite(x.revenueGrowth)?Number(x.revenueGrowth):null;
  const op=finite(x.operatingMargin)?Number(x.operatingMargin):null;
  const fcf=finite(x.fcf)?Number(x.fcf):null;
  if((rev==null||rev<=0)&&x.profitable===false)return "PRE_COMMERCIAL";
  if(x.profitable===false&&["SPACE_SATELLITE","BIOTECH_PHARMA"].includes(businessModel)&&growth!=null&&growth>40)return "VALIDATION";
  if(growth!=null&&growth>=35&&((op!=null&&op>0)||(fcf!=null&&fcf>0)))return "INFLECTION";
  if(growth!=null&&growth>=30)return "HYPERGROWTH";
  if(growth!=null&&growth>=15&&x.profitable!==false)return "SCALE";
  if(growth!=null&&growth>=7&&x.profitable!==false)return "COMPOUNDER";
  if(growth!=null&&growth<0)return "DECLINE_OR_REINVENTION";
  return "MATURITY";
}

function assetClassOf(input:SecurityClassificationInput,model:BusinessModel):SecurityClassification["assetClass"]{
  const a=(input.assetType||"").toLowerCase();
  if(a.includes("crypto"))return "CRYPTO";
  if(a.includes("etf"))return "ETF";
  if(model==="REIT")return "REIT";
  if(model==="BANK"||model==="INSURER"||model==="FINTECH_PAYMENTS")return "FINANCIAL";
  if(model==="BIOTECH_PHARMA"||model==="MEDTECH")return "BIOTECH";
  if(model==="MINER_COMMODITY")return "MINER";
  if(a==="stock"||a==="equity"||!a)return "EQUITY";
  return "OTHER";
}

function capitalIntensityOf(model:BusinessModel):SecurityClassification["capitalIntensity"]{
  if(["SPACE_SATELLITE","AI_DATA_CENTER_INFRA","POWER_UTILITY_INFRA","MINER_COMMODITY","ENERGY"].includes(model))return "EXTREME";
  if(["SEMICONDUCTOR_MEMORY_CYCLICAL","INDUSTRIAL","REIT","DEFENSE"].includes(model))return "HIGH";
  if(["SEMICONDUCTOR_DESIGNER","NETWORKING_COMPUTE_INFRA","BIOTECH_PHARMA","MEDTECH","BANK","INSURER"].includes(model))return "MEDIUM";
  if(["SAAS_SOFTWARE","MARKETPLACE_ADTECH","FINTECH_PAYMENTS"].includes(model))return "LOW";
  return "UNKNOWN";
}

function cyclicalityOf(model:BusinessModel):SecurityClassification["cyclicality"]{
  if(model==="SEMICONDUCTOR_MEMORY_CYCLICAL")return "HIGHLY_CYCLICAL";
  if(["ENERGY","MINER_COMMODITY","INDUSTRIAL","SEMICONDUCTOR_DESIGNER","NETWORKING_COMPUTE_INFRA"].includes(model))return "CYCLICAL";
  if(["POWER_UTILITY_INFRA","INSURER","BIOTECH_PHARMA","MEDTECH"].includes(model))return "DEFENSIVE";
  if(["SAAS_SOFTWARE","MARKETPLACE_ADTECH","FINTECH_PAYMENTS","BANK","REIT","CONSUMER","AI_DATA_CENTER_INFRA","SPACE_SATELLITE"].includes(model))return "MODERATE";
  return "UNKNOWN";
}

function profitabilityOf(input:SecurityClassificationInput,lifecycle:LifecycleStage):SecurityClassification["profitabilityStage"]{
  if((input.revenue==null||input.revenue<=0)&&input.profitable===false)return "PRE_REVENUE";
  if(input.profitable===false)return "PRE_PROFIT";
  if(input.profitable===true&&["MATURITY","COMPOUNDER"].includes(lifecycle))return "MATURE";
  if(input.profitable===true)return "PROFITABLE";
  if(finite(input.operatingMargin))return input.operatingMargin>0?"PROFITABLE":"PRE_PROFIT";
  return "UNKNOWN";
}

export function classifyV4Security(input:SecurityClassificationInput&{evidence:EvidenceRef[]}):SecurityClassification{
  const {model,specific}=classifyBusinessModel(input);
  const lifecycle=lifecycleOf(input,model);
  let confidence=0.30;
  if(input.industry)confidence+=0.20;
  if(input.sector)confidence+=0.10;
  if(specific)confidence+=0.20;
  if(input.evidence.length>=2)confidence+=0.10;
  if(input.revenue!=null||input.profitable!=null)confidence+=0.08;
  confidence=Math.min(0.98,confidence);
  if(!specific)confidence=Math.min(0.55,confidence);
  return{
    assetClass:assetClassOf(input,model),sector:input.sector??null,industry:input.industry??null,
    businessModel:model,lifecycle,capitalIntensity:capitalIntensityOf(model),cyclicality:cyclicalityOf(model),
    profitabilityStage:profitabilityOf(input,lifecycle),confidence:+confidence.toFixed(2),
    evidenceIds:[...new Set(input.evidence.map(e=>e.id))]
  };
}
