import {normalizePriceTick,streamTicker,type PriceTick} from './live-price.ts';
type Listener=(event:{type:'price';tick:PriceTick}|{type:'status';status:string})=>void;
type Client={symbols:Set<string>;send:Listener};
/** Shared only within one server worker. Vendor token limits remain authoritative. */
export class PriceStreamHub{
 private clients=new Map<string,Client>();private sockets=new Map<'us'|'crypto',WebSocket>();
 private subscribed=new Map<'us'|'crypto',Set<string>>();private retry=new Map<string,ReturnType<typeof setTimeout>>();
 private failures=new Map<string,number>();
 private token:string;private createSocket:(url:string)=>WebSocket;
 constructor(token:string,createSocket:(url:string)=>WebSocket=url=>new WebSocket(url)){this.token=token;this.createSocket=createSocket;}
 add(id:string,symbols:string[],send:Listener){
  if(this.clients.has(id))this.remove(id);
  const union=new Set([...this.clients.values()].flatMap(c=>[...c.symbols]));symbols.forEach(s=>union.add(s));
  if(union.size>50||this.clients.size>=10)throw Error('Streaming capacity reached; polling continues.');
  this.clients.set(id,{symbols:new Set(symbols),send});send({type:'status',status:'connecting'});this.sync();return()=>this.remove(id);
 }
 private remove(id:string){this.clients.delete(id);this.sync();}
 private desired(market:'us'|'crypto'){return new Set([...this.clients.values()].flatMap(c=>[...c.symbols]).filter(s=>s.includes('/')===(market==='crypto')));}
 private status(market:'us'|'crypto',status:string){for(const c of this.clients.values())if([...c.symbols].some(s=>s.includes('/')===(market==='crypto')))c.send({type:'status',status});}
 private sync(){for(const market of ['us','crypto'] as const){const wanted=this.desired(market),socket=this.sockets.get(market);
  if(!wanted.size){const timer=this.retry.get(market);if(timer)clearTimeout(timer);this.retry.delete(market);this.sockets.delete(market);this.subscribed.delete(market);socket?.close();continue;}
  if(!socket){if(!this.retry.has(market))this.connect(market);continue;}
  if(socket.readyState!==1)continue;
  const old=this.subscribed.get(market)||new Set<string>();
  const remove=[...old].filter(s=>!wanted.has(s)),add=[...wanted].filter(s=>!old.has(s));
  if(remove.length)socket.send(JSON.stringify({action:'unsubscribe',symbols:remove.map(streamTicker).join(',')}));
  if(add.length)socket.send(JSON.stringify({action:'subscribe',symbols:add.map(streamTicker).join(',')}));
  this.subscribed.set(market,wanted);
 }}
 private connect(market:'us'|'crypto'){
  let socket:WebSocket;try{socket=this.createSocket(`wss://ws.eodhistoricaldata.com/ws/${market}?api_token=${encodeURIComponent(this.token)}`);}catch{this.schedule(market);return;}
  this.sockets.set(market,socket);
  socket.addEventListener('open',()=>{if(this.sockets.get(market)!==socket)return;this.subscribed.set(market,new Set());this.sync();});
  socket.addEventListener('message',event=>{if(this.sockets.get(market)!==socket)return;try{const raw=JSON.parse(String(event.data));if(Number(raw.status_code??raw.status)>=400){this.status(market,'unavailable');socket.close();return;}const tick=normalizePriceTick(raw,market,this.desired(market));if(!tick)return;this.failures.set(market,0);for(const c of this.clients.values())if(c.symbols.has(tick.symbol))c.send({type:'price',tick});}catch{/* Ignore malformed vendor frames, never forward secrets or raw messages. */}});
  const closed=()=>{if(this.sockets.get(market)!==socket)return;this.sockets.delete(market);this.subscribed.delete(market);this.status(market,'reconnecting');this.schedule(market);};
  socket.addEventListener('close',closed);socket.addEventListener('error',()=>{closed();try{socket.close();}catch{}});
 }
 private schedule(market:'us'|'crypto'){
  if(!this.desired(market).size||this.retry.has(market))return;
  const failures=(this.failures.get(market)||0)+1;this.failures.set(market,failures);
  this.retry.set(market,setTimeout(()=>{this.retry.delete(market);if(this.desired(market).size)this.connect(market);},Math.min(60000,2000*2**Math.min(failures,5))));
 }
}
const holder=globalThis as typeof globalThis&{aurynPriceHub?:PriceStreamHub};
export function priceStreamHub(token:string){return holder.aurynPriceHub??=new PriceStreamHub(token);}
