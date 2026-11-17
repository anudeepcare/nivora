const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizedEmail=value=>String(value??'').trim().toLowerCase();
const validPassword=value=>typeof value==='string'&&value.length>=8&&value.length<=4096;
const safeJson=async response=>{try{return await response.json()}catch{return{}}};
const cookieValue=value=>encodeURIComponent(String(value??''));
const retryAfterSeconds=response=>{const value=response?.headers?.get?.('retry-after');if(!value)return null;const numeric=Number(value);if(Number.isFinite(numeric)&&numeric>=0)return Math.min(3600,Math.ceil(numeric));const date=Date.parse(value);return Number.isFinite(date)?Math.min(3600,Math.max(0,Math.ceil((date-Date.now())/1000))):null};
const retryable=status=>['network-error','service-unavailable','rate-limited'].includes(status);

export const parseAuthCookies=header=>{
  const values=Object.fromEntries(String(header??'').split(';').map(part=>part.trim()).filter(Boolean).map(part=>{const at=part.indexOf('=');return at<0?[part,'']:[part.slice(0,at),decodeURIComponent(part.slice(at+1))]}));
  return{accessToken:values.auryn_access??null,refreshToken:values.auryn_refresh??null};
};

const publicUser=user=>user&&typeof user.id==='string'?{id:user.id,email:normalizedEmail(user.email)||null}:null;
const withPrivateSession=(result,session)=>{if(session)Object.defineProperty(result,'session',{value:session,enumerable:false});return result};

export class CustomerAuth{
  constructor({url,publishableKey,fetchImpl=globalThis.fetch,secureCookies=false}={}){
    try{this.url=new URL(url).origin}catch{this.url=null}
    this.publishableKey=typeof publishableKey==='string'&&publishableKey.trim()?publishableKey.trim():null;
    this.fetchImpl=fetchImpl;
    this.secureCookies=secureCookies;
    this.configured=!!(this.url&&this.publishableKey&&typeof fetchImpl==='function');
  }
  headers(token){return{apikey:this.publishableKey,'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})}}
  async request(path,{method='POST',body,token}={}){
    if(!this.configured)return{status:'not-configured'};
    try{const response=await this.fetchImpl(`${this.url}${path}`,{method,headers:this.headers(token),...(body===undefined?{}:{body:JSON.stringify(body)})});if(response.status===429)return{status:'rate-limited',retryAfterSeconds:retryAfterSeconds(response)};return{ok:response.ok,statusCode:response.status,data:await safeJson(response)}}catch{return{status:'network-error'}}
  }
  sessionFrom(data){return data&&typeof data.access_token==='string'&&typeof data.refresh_token==='string'?{accessToken:data.access_token,refreshToken:data.refresh_token,expiresIn:Number.isFinite(Number(data.expires_in))?Math.max(60,Math.floor(Number(data.expires_in))):3600}:null}
  async login({email,password}={}){
    email=normalizedEmail(email);if(!emailPattern.test(email)||!validPassword(password))return{status:'invalid-request'};
    const response=await this.request('/auth/v1/token?grant_type=password',{body:{email,password}});if(response.status)return response;if(response.statusCode>=500)return{status:'service-unavailable'};if(!response.ok)return{status:'invalid-credentials'};
    const user=publicUser(response.data.user),session=this.sessionFrom(response.data);if(!user||!session)return{status:'invalid-response'};
    return withPrivateSession({status:'authenticated',user},session);
  }
  async signup({email,password}={}){
    email=normalizedEmail(email);if(!emailPattern.test(email)||!validPassword(password))return{status:'invalid-request'};
    const response=await this.request('/auth/v1/signup',{body:{email,password}});if(response.status)return response;if(response.statusCode>=500)return{status:'service-unavailable'};if(!response.ok)return{status:'signup-failed'};
    const user=publicUser(response.data.user),session=this.sessionFrom(response.data);if(session&&user)return withPrivateSession({status:'authenticated',user},session);
    return{status:'confirmation-required'};
  }
  async recovery({email,redirectTo}={}){
    email=normalizedEmail(email);if(!emailPattern.test(email))return{status:'invalid-request'};
    const path='/auth/v1/recover'+(redirectTo?`?redirect_to=${encodeURIComponent(redirectTo)}`:'');
    const response=await this.request(path,{body:{email}});if(response.status)return response;if(response.statusCode>=500)return{status:'service-unavailable'};
    return response.ok?{status:'accepted'}:{status:'recovery-failed'};
  }
  async acceptRecovery({accessToken,refreshToken,expiresIn}={}){
    if(typeof accessToken!=='string'||accessToken.length<8||typeof refreshToken!=='string'||refreshToken.length<8)return{status:'invalid-request'};
    const verified=await this.user(accessToken);if(retryable(verified.status))return verified;if(verified.status!=='authenticated')return{status:'invalid-recovery'};
    const session={accessToken,refreshToken,expiresIn:Number.isFinite(Number(expiresIn))?Math.max(60,Math.min(86400,Math.floor(Number(expiresIn)))):3600};
    return withPrivateSession({status:'recovery-authenticated',user:verified.user},session);
  }
  async updatePassword(req,password){
    if(!validPassword(password))return{status:'invalid-request'};const authenticated=await this.authenticate(req);if(authenticated.status!=='authenticated')return authenticated;
    const accessToken=authenticated.session?.accessToken??parseAuthCookies(req?.headers?.cookie).accessToken,response=await this.request('/auth/v1/user',{method:'PUT',token:accessToken,body:{password}});if(response.status)return response;if(response.statusCode>=500)return{status:'service-unavailable'};if(!response.ok)return{status:'password-update-failed'};return{status:'password-updated',user:publicUser(response.data)};
  }
  async user(accessToken){if(!accessToken)return{status:'unauthenticated'};const response=await this.request('/auth/v1/user',{method:'GET',token:accessToken});if(response.status)return response;if(response.statusCode>=500)return{status:'service-unavailable'};if(!response.ok)return{status:'unauthenticated'};const user=publicUser(response.data);return user?{status:'authenticated',user}:{status:'invalid-response'}}
  async refresh(refreshToken){if(!refreshToken)return{status:'unauthenticated'};const response=await this.request('/auth/v1/token?grant_type=refresh_token',{body:{refresh_token:refreshToken}});if(response.status)return response;if(response.statusCode>=500)return{status:'service-unavailable'};if(!response.ok)return{status:'unauthenticated'};const session=this.sessionFrom(response.data);return session?withPrivateSession({status:'refreshed',user:publicUser(response.data.user)},session):{status:'invalid-response'}}
  async authenticate(req){if(!this.configured)return{status:'not-configured'};const tokens=parseAuthCookies(req?.headers?.cookie);let checked=await this.user(tokens.accessToken);if(checked.status==='authenticated')return checked;if(retryable(checked.status))return checked;if(!tokens.refreshToken)return{status:'unauthenticated'};const refreshed=await this.refresh(tokens.refreshToken);if(retryable(refreshed.status))return refreshed;if(refreshed.status!=='refreshed')return{status:'unauthenticated'};checked=await this.user(refreshed.session.accessToken);return checked.status==='authenticated'?withPrivateSession(checked,refreshed.session):checked }
  async logout(req){let{accessToken,refreshToken}=parseAuthCookies(req?.headers?.cookie);if(!this.configured)return{status:'not-configured'};const revoke=token=>this.request('/auth/v1/logout',{token});if(accessToken){const result=await revoke(accessToken);if(result.status)return result;if(result.ok)return{status:'signed-out'};if(result.statusCode!==401||!refreshToken)return result.statusCode>=500?{status:'service-unavailable'}:{status:'logout-failed'}}if(refreshToken){const refreshed=await this.refresh(refreshToken);if(retryable(refreshed.status)||refreshed.status==='not-configured')return refreshed;if(refreshed.status!=='refreshed')return{status:'logout-failed'};accessToken=refreshed.session.accessToken;const result=await revoke(accessToken);if(result.status)return result;if(result.ok)return{status:'signed-out'};return result.statusCode>=500?{status:'service-unavailable'}:{status:'logout-failed'}}return{status:'signed-out'}}
  sessionCookies(session){if(!session)return[];const secure=this.secureCookies?'; Secure':'';return[`auryn_access=${cookieValue(session.accessToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${session.expiresIn}${secure}`,`auryn_refresh=${cookieValue(session.refreshToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`]}
  clearCookies(){const secure=this.secureCookies?'; Secure':'';return[`auryn_access=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,`auryn_refresh=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`]}
}
