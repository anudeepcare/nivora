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
 if(/mining|metals/.test(industry))return{assetClass:"COMMODITY_MINER",archetype:"MINER"};
 if(/semiconductor|memory/.test(text))return{assetClass:"EQUITY",archetype:"SEMICONDUCTOR_CYCLICAL"};
 if(/fuel cell|power generation|distributed power/.test(text))return{assetClass:"EQUITY",archetype:"POWER_INFRASTRUCTURE"};
 if(/ai cloud|gpu cloud|data cent(?:er|re)|accelerated compute/.test(text))return{assetClass:"EQUITY",archetype:"AI_INFRASTRUCTURE"};
 return{assetClass:"EQUITY",archetype:"GENERAL"};
}
