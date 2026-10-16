/** SEC Form 4 code semantics: https://www.sec.gov/files/forms-3-4-5.pdf.
 * Share-count direction alone never establishes a purchase, sale or conviction. */
export function classifyInsiderTransaction(value:unknown){
 const code=typeof value==='string'?value.trim().toUpperCase():'';
 const labels:Record<string,string>={P:'Purchase',S:'Sale',A:'Grant / award',M:'Exercise / conversion',C:'Conversion',X:'Derivative exercise',O:'Derivative exercise',F:'Exercise / tax withholding',D:'Disposition to issuer',G:'Gift',K:'Hedge / equity swap',J:'Other disclosed transaction',V:'Voluntary report',E:'Derivative expiration',H:'Derivative cancellation',L:'Small acquisition',W:'Inheritance',Z:'Voting trust',U:'Tender disposition',I:'Discretionary transaction'};
 return {code:code||null,kind:code==='P'?'purchase':code==='S'?'sale':code==='A'?'grant':['M','C','X','O'].includes(code)?'exercise':code in labels?'other':'unclassified',label:labels[code]??'Unclassified — inspect filing'};
}
const number=(x:unknown)=>x==null||x===''||typeof x==='boolean'?null:Number.isFinite(Number(x))?Number(x):null;
export function summarizeInsiderTransactions(rows:any[]){
 const recent=rows.map(x=>({...classifyInsiderTransaction(x.transactionCode),name:x.name||'Insider',change:number(x.change),transactionPrice:number(x.transactionPrice),transactionDate:x.transactionDate||null,filingDate:x.filingDate||null,date:x.transactionDate||null,source:'Finnhub reported Form 4'}));
 const count=(kind:string)=>recent.filter(x=>x.kind===kind).length;
 const buys=count('purchase'),sells=count('sale');
 return {label:recent.length?'Classified reported transactions':'Unavailable',buys:recent.length?buys:null,sells:recent.length?sells:null,grants:count('grant'),exercises:count('exercise'),other:count('other'),unclassified:count('unclassified'),recent:recent.slice(0,10),disclosure:'Counts describe reported transaction types, not net share flow or insider conviction. Grants, exercises, gifts and withholding are separate from purchases and sales. Transaction and filing dates can differ.'};
}

/** Ownership and insider entitlements are independent. Missing is never a measured zero. */
export function applyOwnershipAvailability(institutional:Record<string,any>,insiders:ReturnType<typeof summarizeInsiderTransactions>,hasInstitutional:boolean,hasInsiderFeed:boolean){
 const ownership={...institutional,available:hasInstitutional};
 if(!hasInstitutional){
  for(const key of ['reportingRows','reportingManagers','increased','reduced','netReportedShareChange','totalShares','priorTotalShares','shareChangePct','totalValue','priorTotalValue','valueChangePct','newManagers','exitedManagers','unchangedManagers','addBreadthPct','trimBreadthPct','institutionalScore']) (ownership as Record<string,any>)[key]=null;
  Object.assign(ownership,{label:'Unavailable',directionLabel:'Ownership feed unavailable',netChangeLabel:'Unavailable',totalValueLabel:null,priorTotalValueLabel:null,top:[],biggestBuyers:[],biggestSellers:[],newPositions:[],exits:[]});
 }
 const transactions={...insiders,available:hasInsiderFeed};
 if(!hasInsiderFeed) Object.assign(transactions,{label:'Unavailable',reason:'Insider transactions feed unavailable',buys:null,sells:null,grants:null,exercises:null,other:null,unclassified:null,recent:[]});
 else if(!insiders.recent.length) Object.assign(transactions,{label:'No transactions returned',buys:0,sells:0});
 return {institutional:ownership,insiders:transactions};
}
