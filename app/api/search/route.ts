import {NextResponse} from "next/server";
import {sharedJson} from "@/lib/shared-cache";
const aliases:any[]=[
["AAPL","Apple Inc.","NASDAQ","stock",["apple"]],["MSFT","Microsoft Corporation","NASDAQ","stock",["microsoft"]],
["NVDA","NVIDIA Corporation","NASDAQ","stock",["nvidia","nvdia"]],["MU","Micron Technology, Inc.","NASDAQ","stock",["micron","micron technology"]],
["CRM","Salesforce, Inc.","NYSE","stock",["salesforce","sales force"]],["SAP","SAP SE","NYSE","stock",["sap","sap se"]],["META","Meta Platforms, Inc.","NASDAQ","stock",["meta","facebook"]],
["GOOGL","Alphabet Inc.","NASDAQ","stock",["google","alphabet"]],["AMZN","Amazon.com, Inc.","NASDAQ","stock",["amazon"]],
["TSLA","Tesla, Inc.","NASDAQ","stock",["tesla"]],["IREN","IREN Limited","NASDAQ","stock",["iren","iris energy"]],
["NBIS","Nebius Group N.V.","NASDAQ","stock",["nebius","nbis"]],["HIMS","Hims & Hers Health, Inc.","NYSE","stock",["hims","hims hers"]],
["APP","AppLovin Corporation","NASDAQ","stock",["applovin","app lovin"]],["SOFI","SoFi Technologies, Inc.","NASDAQ","stock",["sofi"]],
["BTC/USD","Bitcoin","CRYPTO","crypto",["bitcoin","btc","btcusd","btc-usd"]],["ETH/USD","Ethereum","CRYPTO","crypto",["ethereum","eth","ethusd","eth-usd"]],
["SOL/USD","Solana","CRYPTO","crypto",["solana","sol","solusd","sol-usd"]],["XRP/USD","XRP","CRYPTO","crypto",["xrp","ripple"]],
["DOGE/USD","Dogecoin","CRYPTO","crypto",["dogecoin","doge"]]
];
export async function GET(req:Request){const q=(new URL(req.url).searchParams.get("q")||"").trim().toLowerCase();if(q.length<1)return NextResponse.json({results:[]});
const local=aliases.filter(x=>x[0].toLowerCase().includes(q)||x[1].toLowerCase().includes(q)||x[4].some((a:string)=>a.includes(q))).map(x=>({symbol:x[0],name:x[1],exchange:x[2],type:x[3]}));
if(local.length>=5||["bitcoin","btc","ethereum","eth","solana","sol","xrp","doge"].some(x=>q.includes(x)))return NextResponse.json({results:local.slice(0,8),cached:true});
const key=process.env.TWELVE_DATA_API_KEY;if(!key)return NextResponse.json({results:local});
try{const u=`https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(q)}&outputsize=10&apikey=${key}`;const j=await sharedJson(u,["twelve","search",q],86400,2200);const remote=(j.data||[]).map((x:any)=>({symbol:x.symbol,name:x.instrument_name||x.name||x.symbol,exchange:x.exchange,type:x.instrument_type||x.type}));const seen=new Set();return NextResponse.json({results:[...local,...remote].filter(x=>!seen.has(x.symbol)&&seen.add(x.symbol)).slice(0,8)})}catch{return NextResponse.json({results:local})}}
