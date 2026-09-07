export type AssetClass="EQUITY"|"ETF"|"REIT"|"FINANCIAL"|"BIOTECH_PREPROFIT"|"COMMODITY_MINER"|"CRYPTO"|"OTHER";
export type BusinessArchetype="COMPOUNDER"|"HYPERGROWTH"|"AI_INFRASTRUCTURE"|"SEMICONDUCTOR_CYCLICAL"|"POWER_INFRASTRUCTURE"|"BANK"|"INSURER"|"REIT"|"BIOTECH_PREPROFIT"|"MINER"|"GENERAL";
export function classifySecurity(x:any):{assetClass:AssetClass;archetype:BusinessArchetype}{
 const at=String(x?.assetType||"").toLowerCase(),industry=String(x?.industry||x?.profile?.finnhubIndustry||"").toLowerCase(),text=[x?.name,x?.description,industry].filter(Boolean).join(" ").toLowerCase();
 if(at==="crypto"||text.includes("cryptocurrency"))return{assetClass:"CRYPTO",archetype:"GENERAL"};
 if(at==="etf"||/\betf\b|exchange.traded fund|nasdaq.100|s&p 500/.test(text))return{assetClass:"ETF",archetype:"GENERAL"};
 if(/reit|real estate investment trust/.test(text))return{assetClass:"REIT",archetype:"REIT"};
 if(/bank/.test(industry))return{assetClass:"FINANCIAL",archetype:"BANK"};
 if(/insurance/.test(industry))return{assetClass:"FINANCIAL",archetype:"INSURER"};
 if(/biotech|pharma/.test(industry)&&x?.profitable===false)return{assetClass:"BIOTECH_PREPROFIT",archetype:"BIOTECH_PREPROFIT"};
 // Preserve the company's economic engine before broad sector labels. A miner that now
 // has explicit AI/HPC hosting evidence is a hybrid infrastructure company, while a
 // semiconductor designer remains a semiconductor even when its products serve data centers.
 if(/semiconductor|memory/.test(text))return{assetClass:"EQUITY",archetype:"SEMICONDUCTOR_CYCLICAL"};
 if(/fuel cell|power generation|distributed power|onsite power/.test(text))return{assetClass:"EQUITY",archetype:"POWER_INFRASTRUCTURE"};
 if(/ai cloud|gpu cloud|gpu compute|ai data cent(?:er|re)|data cent(?:er|re).*(?:ai|hpc|gpu)|high[- ]performance computing|hpc|accelerated compute hosting|hyperscale data cent(?:er|re)/.test(text))return{assetClass:"EQUITY",archetype:"AI_INFRASTRUCTURE"};
 if(/mining|metals/.test(industry))return{assetClass:"COMMODITY_MINER",archetype:"MINER"};
 return{assetClass:"EQUITY",archetype:"GENERAL"};
}
