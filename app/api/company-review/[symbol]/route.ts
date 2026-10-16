import {NextResponse} from 'next/server';
import {authorizeRequest} from '@/lib/server/authorization';
import {buildReviewContext,isSourceReviewAdmin,validateCompanySourceReview,saveCompanySourceReview} from '@/lib/server/company-source-reviews';
import {GET as getCompany} from '@/app/api/company/[symbol]/route';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
type Context={params:Promise<{symbol:string}>};
async function readEvidence(req:Request,context:Context){
 const symbol=(await context.params).symbol.toUpperCase();
 if(!/^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(symbol))return {error:json({error:'Unsupported company symbol.'},400)};
 const response=await getCompany(req,{params:Promise.resolve({symbol})});const company=await response.json();
 if(!company.cik)return {error:json({error:'Current SEC company evidence is unavailable.'},503)};
 return {company,context:buildReviewContext(symbol,company)};
}
export async function GET(req:Request,context:Context){
 const auth=await authorizeRequest(req);if(auth.response)return auth.response;
 const read=await readEvidence(req,context);if(read.error)return read.error;
 return json({...read.context,canReview:isSourceReviewAdmin(auth.user),sourceReview:read.company.sourceReview??{state:'UNREVIEWED'},valuationReview:read.company.valuationReview??null,businessEvidence:read.company.businessEvidence??[],sourcePolicy:'Only current SEC filings for this issuer are accepted. Issuer-host and third-party sources are not connected to the review workflow.'});
}
export async function POST(req:Request,context:Context){
 const auth=await authorizeRequest(req,true);if(auth.response)return auth.response;
 let body:unknown;try{const raw=await req.text();if(raw.length>65536)return json({error:'Review is too large.'},413);body=JSON.parse(raw);}catch{return json({error:'A valid source-review document is required.'},400);}
 const read=await readEvidence(req,context);if(read.error)return read.error;
 const checked=validateCompanySourceReview(body,read.context);if(!checked.ok)return json({error:checked.reason,code:checked.code},checked.code==='STALE_EVIDENCE_REVISION'?409:400);
 const saved=await saveCompanySourceReview({symbol:read.context.symbol,cik:read.context.cik,reviewedBy:auth.user.id,payload:checked.value});
 if(saved.state!=='SAVED')return json({error:saved.reason,code:'SOURCE_REVIEW_STORAGE_UNAVAILABLE'},503);
 return json({...saved,message:'Source review saved. Refresh research to evaluate it with current evidence. Missing facts and unsupported valuation methods remain unavailable.'},201);
}
