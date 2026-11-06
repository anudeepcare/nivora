import {createHmac,createHash,timingSafeEqual} from 'node:crypto';
export const recoveryCookieName='auryn-password-recovery';
export function recoveryProof(userId:string,accessToken:string,secret:string,now=Date.now()) {
 if(!secret)throw Error('Recovery configuration unavailable');
 const payload=Buffer.from(JSON.stringify({userId,token:createHash('sha256').update(accessToken).digest('hex'),expires:now+15*60_000})).toString('base64url');
 return payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');
}
export function validRecoveryProof(proof:string|undefined,userId:string,accessToken:string,secret:string,now=Date.now()) {
 if(!proof||!secret||proof.length>2048)return false;
 try{const [payload,signature,...extra]=proof.split('.');if(extra.length||!signature)return false;
 const expected=createHmac('sha256',secret).update(payload).digest();const actual=Buffer.from(signature,'base64url');
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return false;
 const value=JSON.parse(Buffer.from(payload,'base64url').toString());
 return value.userId===userId&&value.token===createHash('sha256').update(accessToken).digest('hex')&&value.expires>now&&value.expires<=now+15*60_000;
 }catch{return false;}
}
