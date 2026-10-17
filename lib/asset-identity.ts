// Reviewed, bundled identifiers. Symbols can identify different issuers across
// exchanges. Sources: verification/native-release/logo-sources.json.
const identities:Record<string,{file:string;name:RegExp}>={
 AAPL:{file:'AAPL.svg',name:/apple/i},MSFT:{file:'',name:/microsoft/i},
 NVDA:{file:'NVDA.svg',name:/nvidia/i},GOOG:{file:'GOOGL.svg',name:/alphabet|google/i},GOOGL:{file:'GOOGL.svg',name:/alphabet|google/i},
 META:{file:'META.svg',name:/meta platforms|facebook|^meta$/i},TSLA:{file:'TSLA.svg',name:/tesla/i},NFLX:{file:'NFLX.svg',name:/netflix/i},
 AMD:{file:'AMD.svg',name:/advanced micro|^amd$/i},ADBE:{file:'ADBE.png',name:/adobe/i},CRM:{file:'CRM.png',name:/salesforce/i},
 SHOP:{file:'SHOP.svg',name:/shopify/i},SPOT:{file:'SPOT.svg',name:/spotify/i},AMZN:{file:'AMZN.png',name:/amazon/i},
 IREN:{file:'IREN.svg',name:/iren limited|iris energy|^iren$/i},NBIS:{file:'NBIS.svg',name:/nebius/i},APP:{file:'APP.svg',name:/applovin/i},
 ASTS:{file:'ASTS.png',name:/ast space|ast & science/i},CIFR:{file:'CIFR.png',name:/cipher/i},HIMS:{file:'HIMS.png',name:/hims/i},
 SOFI:{file:'SOFI.png',name:/sofi/i},CRWV:{file:'CRWV.png',name:/coreweave/i},MU:{file:'MU.png',name:/micron/i},PLTR:{file:'PLTR.png',name:/palantir/i},
 SOL:{file:'SOL.svg',name:/solana/i},XRP:{file:'XRP.svg',name:/xrp|ripple/i},DOGE:{file:'DOGE.svg',name:/dogecoin/i},
};
export function assetIdentity(symbol:string,name?:string){
 const key=symbol.trim().toUpperCase(),possible=/^(BTC|ETH|SOL|XRP|DOGE)(?:[/-](?:USD|USDT))?$/.exec(key)?.[1];
 const cryptoNames:Record<string,RegExp>={BTC:/bitcoin/i,ETH:/ethereum/i,SOL:/solana/i,XRP:/xrp|ripple/i,DOGE:/dogecoin/i};
 const crypto=possible&&(/[/-]/.test(key)||!name||name.toUpperCase()===key||cryptoNames[possible].test(name))?possible:null;
 const lookup=crypto||key,entry=identities[lookup],specificName=(name||'').trim();
 const matches=entry&&(!specificName||specificName.toUpperCase()===key||entry.name.test(specificName));
 return {key,crypto:crypto||null,microsoft:lookup==='MSFT'&&Boolean(matches),local:matches&&entry.file?'/asset-logos/'+entry.file:null};
}
export function assetLogoCandidates(symbol:string,name?:string,logoUrl?:string|null){
 const {local}=assetIdentity(symbol,name),remote=logoUrl&&/^https:\/\//i.test(logoUrl)?logoUrl:null;
 return [...new Set([local,remote].filter((value):value is string=>Boolean(value)))];
}
