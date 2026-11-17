const valid=symbol=>/^[A-Z0-9._-]{1,15}$/.test(symbol);
const identity=symbol=>symbol.includes('.')?symbol:`${symbol}.US`;
const commit=(list,candidate,persist,symbol)=>{try{persist?.(JSON.stringify(candidate))}catch{return{status:'storage-error',symbol}}list.symbols=candidate;return null};
export class Watchlist {
  constructor({symbols=[],max=50}={}){this.max=max;this.symbols=[];for(const symbol of symbols)this.add(symbol)}
  add(value,{persist}={}){const symbol=String(value??'').trim().toUpperCase();if(!valid(symbol))return{status:'invalid'};if(this.symbols.some(saved=>identity(saved)===identity(symbol)))return{status:'duplicate',symbol};if(this.symbols.length>=this.max)return{status:'full'};const candidate=[...this.symbols,symbol],failed=commit(this,candidate,persist,symbol);return failed??{status:'added',symbol}}
  remove(value,{persist}={}){const requested=String(value??'').trim().toUpperCase();if(!valid(requested))return{status:'not-found'};const index=this.symbols.findIndex(saved=>identity(saved)===identity(requested));if(index<0)return{status:'not-found'};const symbol=this.symbols[index],candidate=this.symbols.filter((_,position)=>position!==index),failed=commit(this,candidate,persist,symbol);return failed??{status:'removed',symbol}}
  serialize(){return JSON.stringify(this.symbols)}
}
