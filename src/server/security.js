import crypto from 'node:crypto';

const digest=value=>crypto.createHash('sha256').update(value).digest();
export class ApiKeyAccessControl {
  constructor({apiKey}={}){this.apiKey=typeof apiKey==='string'&&apiKey.length>=24?apiKey:null;this.configured=!!this.apiKey}
  authenticate(header){if(!this.configured)return{status:'not-configured',principal:null};if(typeof header!=='string'||!header.startsWith('Bearer '))return{status:'unauthorized',principal:null};const supplied=header.slice(7),actual=digest(this.apiKey),candidate=digest(supplied);if(!crypto.timingSafeEqual(actual,candidate))return{status:'unauthorized',principal:null};return{status:'authenticated',principal:`key:${actual.toString('hex').slice(0,16)}`}}
}

export class FixedWindowLimiter {
  constructor({limit=120,windowMs=60000,now=Date.now,maxClients=10000}={}){this.limit=limit;this.windowMs=windowMs;this.now=now;this.maxClients=maxClients;this.clients=new Map()}
  consume(client){const now=this.now();let state=this.clients.get(client);if(!state||now-state.windowStart>=this.windowMs)state={windowStart:now,count:0};if(state.count>=this.limit)return{allowed:false,retryAfterSeconds:Math.max(1,Math.ceil((state.windowStart+this.windowMs-now)/1000)),remaining:0};state.count++;this.clients.delete(client);this.clients.set(client,state);while(this.clients.size>this.maxClients)this.clients.delete(this.clients.keys().next().value);return{allowed:true,retryAfterSeconds:0,remaining:this.limit-state.count}}
}

export class BrowserSessionStore {
  constructor({now=Date.now,ttlMs=8*60*60*1000,maxSessions=1000,randomBytes=crypto.randomBytes}={}){this.now=now;this.ttlMs=ttlMs;this.maxSessions=maxSessions;this.randomBytes=randomBytes;this.sessions=new Map()}
  create(principal){const token=this.randomBytes(32).toString('base64url');this.sessions.set(token,{principal,expiresAt:this.now()+this.ttlMs});while(this.sessions.size>this.maxSessions)this.sessions.delete(this.sessions.keys().next().value);return{token,cookie:`auryn_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(this.ttlMs/1000)}`}}
  authenticate(cookieHeader){const match=String(cookieHeader??'').match(/(?:^|;\s*)auryn_session=([A-Za-z0-9_-]+)/);if(!match)return null;const session=this.sessions.get(match[1]);if(!session||session.expiresAt<=this.now()){this.sessions.delete(match[1]);return null}return{status:'authenticated',principal:session.principal,token:match[1]}}
  revoke(cookieHeader){const session=this.authenticate(cookieHeader);if(session)this.sessions.delete(session.token)}
}

export const clientAddress=req=>req?.socket?.remoteAddress||'unknown';
const isWrite=req=>!['GET','HEAD','OPTIONS'].includes(req?.method??'GET');
const originMatches=req=>{const origin=req?.headers?.origin;if(!origin)return false;try{return new URL(origin).host===req.headers.host}catch{return false}};

export class RequestGuard {
  constructor({apiKey,limit=120,windowMs=60000,maxClients=10000,sessions=new BrowserSessionStore()}={}){this.auth=new ApiKeyAccessControl({apiKey});this.sessions=sessions;this.limiter=new FixedWindowLimiter({limit,windowMs,maxClients})}
  createSession(apiKey){const auth=this.auth.authenticate(`Bearer ${apiKey??''}`);if(auth.status!=='authenticated')return{status:this.auth.configured?'unauthorized':'not-configured'};return{status:'authenticated',...this.sessions.create(auth.principal)}}
  check(req,{publicPath=false}={}){const limited=this.limiter.consume(clientAddress(req));if(!limited.allowed)return{status:'rate-limited',...limited};if(isWrite(req)&&req?.headers?.origin&&!originMatches(req))return{status:'unauthorized',reason:'cross-origin-write',remaining:limited.remaining};if(publicPath){if(isWrite(req)&&req?.headers?.cookie&&!originMatches(req))return{status:'unauthorized',reason:'csrf-origin-required',remaining:limited.remaining};return{status:'allowed',principal:'public',remaining:limited.remaining}}const bearer=this.auth.authenticate(req?.headers?.authorization),session=this.sessions.authenticate(req?.headers?.cookie),usingBearer=bearer.status==='authenticated',auth=usingBearer?bearer:session;if(!auth)return{status:this.auth.configured?'unauthorized':'not-configured',remaining:limited.remaining};if(isWrite(req)&&!usingBearer&&!originMatches(req))return{status:'unauthorized',reason:'csrf-origin-required',remaining:limited.remaining};return{status:'allowed',principal:auth.principal,remaining:limited.remaining}}
}
