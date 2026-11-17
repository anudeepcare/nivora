import {normalizeSettings,SETTINGS_KEY} from './settings-state.js';
import {inspectPortfolioImport} from './portfolio-ledger.js';
import {normalizeCashBalance,CASH_BALANCE_KEY} from './portfolio-cash.js';

const validSymbol=value=>typeof value==='string'&&/^[A-Z0-9._-]{1,15}$/.test(value);
const WATCHLIST_KEY='auryn.watchlist',PORTFOLIO_KEY='auryn.portfolio';

export function createLocalWorkspaceBackup({settings,watchlistSymbols=[],portfolioRaw='[]',cashBalance=null,cashState=undefined,exportedAt=new Date()}={}){
  if(!(exportedAt instanceof Date)||!Number.isFinite(exportedAt.getTime()))return{status:'invalid',reason:'A valid export time is required.'};
  if(!Array.isArray(watchlistSymbols)||watchlistSymbols.some(symbol=>!validSymbol(symbol)))return{status:'invalid',reason:'The local watchlist contains an invalid symbol.'};
  const portfolio=inspectPortfolioImport(portfolioRaw,{asOf:exportedAt.toISOString().slice(0,10)});
  const data={
    schema:'auryn-browser-backup-v1',
    exportedAt:exportedAt.toISOString(),
    storage:'browser-local-only',
    accountSynced:false,
    restore:'validated-browser-replace',
    settings:normalizeSettings(settings),
    watchlist:[...watchlistSymbols],
    cash:cashState?.status==='invalid'?{status:'recovery-required',raw:cashState.raw??'',warning:'Original raw cash storage is preserved verbatim. Review it before sharing or replacing it.'}:normalizeCashBalance(cashState?.status==='available'?cashState.amount:cashBalance).status==='available'?{amount:cashState?.status==='available'?cashState.amount:cashBalance,currency:'USD'}:null,
    portfolio:portfolio.status==='valid'
      ?{status:'valid',transactions:portfolio.transactions}
      :{status:'recovery-required',raw:portfolioRaw,warning:'Original raw browser content is preserved verbatim. Review it before sharing or manually extracting transactions.'}
  };
  return{status:'available',filename:`auryn-local-backup-${exportedAt.toISOString().slice(0,10)}.json`,data,text:JSON.stringify(data,null,2)};
}

export function inspectLocalWorkspaceBackup(text,{asOf=new Date().toISOString().slice(0,10)}={}){let data;try{data=JSON.parse(text)}catch{return{status:'invalid',reason:'Backup is not valid JSON.'}}if(!data||Array.isArray(data)||typeof data!=='object'||data.schema!=='auryn-browser-backup-v1'||data.storage!=='browser-local-only'||data.accountSynced!==false)return{status:'invalid',reason:'Backup schema or storage scope is not supported.'};if(!data.settings||Array.isArray(data.settings)||typeof data.settings!=='object')return{status:'invalid',reason:'Backup settings are missing.'};if(!Array.isArray(data.watchlist)||data.watchlist.length>50||data.watchlist.some(symbol=>!validSymbol(symbol))||new Set(data.watchlist).size!==data.watchlist.length)return{status:'invalid',reason:'Backup watchlist is invalid or contains duplicates.'};if(data.portfolio?.status!=='valid'||!Array.isArray(data.portfolio.transactions))return{status:'invalid',reason:'Recovery-required portfolio payloads cannot be restored automatically.'};const portfolio=inspectPortfolioImport(JSON.stringify(data.portfolio.transactions),{asOf});if(portfolio.status!=='valid')return{status:'invalid',reason:'Backup transactions failed chronological portfolio validation.'};const cash=data.cash===null||data.cash===undefined?{status:'unset',amount:null,currency:'USD'}:data.cash?.currency==='USD'?normalizeCashBalance(data.cash.amount):{status:'invalid'};if(cash.status==='invalid')return{status:'invalid',reason:'Backup cash balance is invalid.'};return{status:'valid',settings:normalizeSettings(data.settings),watchlist:[...data.watchlist],transactions:portfolio.transactions,cash,exportedAt:typeof data.exportedAt==='string'?data.exportedAt:null}}

export function restoreLocalWorkspaceBackup(storage,text,options={}){const inspected=inspectLocalWorkspaceBackup(text,options);if(inspected.status!=='valid')return inspected;const next=new Map([[SETTINGS_KEY,JSON.stringify(inspected.settings)],[WATCHLIST_KEY,JSON.stringify(inspected.watchlist)],[PORTFOLIO_KEY,JSON.stringify(inspected.transactions)],[CASH_BALANCE_KEY,inspected.cash.status==='available'?JSON.stringify({amount:inspected.cash.amount,currency:'USD'}):null]]),previous=new Map([...next.keys()].map(key=>[key,storage.getItem(key)]));try{for(const[key,value]of next)value===null?storage.removeItem(key):storage.setItem(key,value)}catch{return rollback(storage,previous)}return{status:'restored',settings:inspected.settings,watchlist:inspected.watchlist,transactions:inspected.transactions,cash:inspected.cash}}

function rollback(storage,previous){for(const[key,value]of previous)try{value===null?storage.removeItem(key):storage.setItem(key,value)}catch{}return{status:'storage-error',reason:'Browser storage failed; prior values were restored where possible.'}}
