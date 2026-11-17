const pending=(...contracts)=>contracts.map(contract=>({contract,status:'pending-live-verification'}));

export const FEATURE_COVERAGE=Object.freeze([
  {id:'symbol-search',screen:'Header search',route:'/api/search?q={query}',integrated:true,mode:'provider-gated',providers:{EODHD:['search']},liveAccess:'unverified',acceptance:pending('canonical code and exchange identity','share-class symbols','malformed-result filtering')},
  {id:'research-core',screen:'Research',route:'/api/research/{canonicalSymbol}',integrated:true,mode:'provider-gated',providers:{EODHD:['quote','history','fundamentals'],'SentiSense Pro':['rating','analystRatings','analystEstimates']},liveAccess:'unverified',acceptance:pending('quote code, currency and timestamp','adjusted-history semantics','filed fundamental periods','estimate fiscal horizons and preview flags')},
  {id:'research-intelligence',screen:'Research evidence',route:'/api/research/{canonicalSymbol}/intelligence',integrated:true,mode:'provider-gated',providers:{EODHD:['news','earnings','dividends','insiderTransactions'],'SentiSense Pro':['documents','earnings','institutionalHolders','insiders','politicians','optionsSummary']},liveAccess:'unverified',acceptance:pending('news timestamps and source identity','upcoming earnings identity, timing and estimate fields','ownership units and filing dates','options ratio, volatility and as-of units','historical earnings field variants')},
  {id:'today-market-snapshot',screen:'Today',route:'/api/today/market-snapshot',integrated:true,mode:'provider-gated-fixed-benchmarks',providers:{EODHD:['quote']},liveAccess:'unverified',acceptance:pending('SPY.US, QQQ.US and DIA.US exact returned identities','explicit USD currency','nonfuture quote timestamps','optional change-percent field')},
  {id:'portfolio-valuation',screen:'Portfolio',route:'/api/portfolio/quotes',integrated:true,mode:'provider-gated',providers:{EODHD:['quote']},liveAccess:'unverified',acceptance:pending('exact requested/returned security identity','explicit USD currency','nonfuture quote timestamp')},
  {id:'portfolio-history',screen:'Portfolio',route:'/api/portfolio/history',integrated:false,mode:'blocked-accounting',providers:{},liveAccess:'not-attempted',acceptance:pending('dated split-adjusted holdings','unadjusted close currency and identity','dividends and corporate actions','liquidation zero-value dates')},
  {id:'screener',screen:'Discover',route:'/api/discover/screen',integrated:true,mode:'provider-gated-broad-screen',providers:{'SentiSense Pro':['screener']},liveAccess:'unverified',acceptance:pending('SentiSense screener entitlement','result-list response variants','pagination and quota cost','filter field catalog before Quality/Value/Change/Pace presets')}
]);

const ACCEPTANCE_OPERATIONS=[['EODHD','quote'],['EODHD','history'],['EODHD','fundamentals'],['SentiSense Pro','analystRatings'],['SentiSense Pro','optionsSummary']];
export function buildLiveAcceptancePlan(symbols){
  if(!Array.isArray(symbols)||symbols.length<1)throw new TypeError('One or more canonical symbols are required');
  if(symbols.length>5)throw new RangeError('Live acceptance is bounded to five canonical symbols per run');
  const canonical=symbols.map(symbol=>{const value=String(symbol).trim().toUpperCase();if(!/^[A-Z0-9_-]{1,12}\.[A-Z0-9_-]{1,8}$/.test(value))throw new TypeError('Each security must be an exchange-qualified canonical symbol');return value});
  return canonical.flatMap(symbol=>ACCEPTANCE_OPERATIONS.map(([provider,operation])=>({symbol,provider,operation,status:'pending-live-verification',output:'status-and-provenance-only; provider payload is not persisted'})));
}
