import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import type {BusinessClaim,ValuationReview} from '../research-financial-assessment';
import type {FinancialFact} from '../sec-company-evidence';

const TABLE='auryn_company_source_reviews';
const dimensions=new Set(['deployedCapacity','usableCapacity','commercialConversion','regulatoryDependencies','cashRunway','funding','dilution','segmentEconomics','contractedCapacity','operationalCapacity','power','utilization','delivery','equipmentEconomics','customers','capex','miningExposure','revenue','profitability','cashGeneration','balanceSheet','reinvestment','moat']);
const date=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const object=(x:unknown):x is Record<string,unknown>=>Boolean(x&&typeof x==='object'&&!Array.isArray(x));
const only=(o:Record<string,unknown>,keys:string[])=>Object.keys(o).every(k=>keys.includes(k));
const text=(x:unknown,min:number,max:number):x is string=>typeof x==='string'&&x.trim().length>=min&&x.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(x);
const number=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
export function isSourceReviewAdmin(user:{id:string;app_metadata?:Record<string,unknown>},ids=process.env.AURYN_ADMIN_USER_IDS??''){return user.app_metadata?.role==='admin'||ids.split(',').map(s=>s.trim()).filter(Boolean).includes(user.id);}
function secUrl(raw:unknown,cik:string):raw is string{
 if(typeof raw!=='string')return false;
 try{const u=new URL(raw);return u.protocol==='https:'&&u.hostname==='www.sec.gov'&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash&&u.pathname.startsWith(`/Archives/edgar/data/${Number(cik)}/`)&&!u.pathname.includes('..');}catch{return false;}
}
export type ReviewSource={id:string;url:string;publishedAt:string;label:string};
export type CompanyReviewContext={symbol:string;cik:string;asOf:string;evidenceRevision:string;facts:FinancialFact[];sources:ReviewSource[];evidenceIds:string[]};
export type CompanyReviewPayload={evidenceRevision:string;readEvidenceIds:string[];citationsReviewed:true;reviewNotes:string;valuationReview:ValuationReview|null;businessEvidence:BusinessClaim[]};
export function buildReviewContext(symbol:string,company:any,asOf=new Date().toISOString().slice(0,10)):CompanyReviewContext{
 const cik=String(company?.cik??'');
 const facts:FinancialFact[]=Array.isArray(company?.financials?.facts)?company.financials.facts.filter((f:any)=>typeof f.id==='string'&&number(f.value)&&date(f.filedAt)&&f.filedAt<=asOf):[];
 const sources:ReviewSource[]=[];
 for(const fact of facts.filter(f=>f.kind==='REPORTED_FACT'))for(const sourceUrl of [...new Set([fact.sourceUrl,...(fact.sourceUrls??[])])])if(secUrl(sourceUrl,cik))sources.push({id:fact.id,url:sourceUrl,publishedAt:fact.filedAt,label:`${fact.metric} · ${fact.periodEnd}`});
 for(const filing of company?.filings??[])if(typeof filing.accession==='string'&&/^\d{10}-\d{2}-\d{6}$/.test(filing.accession)&&secUrl(filing.url,cik)&&date(filing.date)&&filing.date<=asOf)sources.push({id:`filing:${filing.accession}`,url:filing.url,publishedAt:filing.date,label:`${filing.form} · ${filing.date}`});
 const canonicalFacts=facts.map(f=>JSON.stringify(f)).sort();
 const canonicalSources=sources.map(s=>JSON.stringify(s)).sort();
 const evidenceRevision=createHash('sha256').update(JSON.stringify({symbol,cik,facts:canonicalFacts,sources:canonicalSources,issues:company?.financials?.issues??[]})).digest('hex');
 return {symbol,cik,asOf,evidenceRevision,facts,sources,evidenceIds:[...new Set([...facts.map(f=>f.id),...sources.map(s=>s.id)])]};
}
export function validateCompanySourceReview(raw:unknown,context:CompanyReviewContext):{ok:true;value:CompanyReviewPayload}|{ok:false;code:string;reason:string}{
 const fail=(reason:string,code='INVALID_SOURCE_REVIEW')=>({ok:false as const,code,reason});
 if(!object(raw)||!only(raw,['evidenceRevision','readEvidenceIds','citationsReviewed','reviewNotes','valuationReview','businessEvidence']))return fail('Only source review metadata is accepted; scores, prices and financial amounts are server-owned.');
 if(raw.evidenceRevision!==context.evidenceRevision)return fail('Company evidence changed. Reload and review the current citations.','STALE_EVIDENCE_REVISION');
 if(raw.citationsReviewed!==true||!text(raw.reviewNotes,20,2000))return fail('Explicit citation review and a substantive review note are required.');
 if(!Array.isArray(raw.readEvidenceIds)||raw.readEvidenceIds.length===0||raw.readEvidenceIds.length>5000||raw.readEvidenceIds.some(id=>typeof id!=='string'||!context.evidenceIds.includes(id)))return fail('Read evidence IDs must identify current company evidence.');
 const readIds=raw.readEvidenceIds as string[];
 const citation=(item:Record<string,unknown>)=>item.source==='SEC'&&date(item.publishedAt)&&item.publishedAt<=context.asOf&&context.sources.some(s=>s.url===item.sourceUrl&&s.publishedAt===item.publishedAt&&readIds.includes(s.id));
 let review:ValuationReview|null=null;
 if(raw.valuationReview!==null){
  const r=raw.valuationReview;
  if(!object(r)||!only(r,['shareCountFactId','unitsPerListedShare','shareClass','source','sourceUrl','publishedAt','claimsReviewed']))return fail('Listed-share review has unsupported fields.');
  const share=context.facts.find(f=>f.id===r.shareCountFactId&&f.metric==='sharesOutstanding'&&f.scope==='POINT_IN_TIME'&&f.unit==='shares'&&f.value>0);
  if(!share||!readIds.includes(share.id)||context.facts.some(f=>f.metric==='sharesOutstanding'&&(f.periodEnd>share.periodEnd||f.periodEnd===share.periodEnd&&f.filedAt>share.filedAt)))return fail('Review the latest current reported share count; weighted annual averages are not listed shares.');
  if(!number(r.unitsPerListedShare)||r.unitsPerListedShare<=0||r.unitsPerListedShare>10000||!text(r.shareClass,3,160)||r.claimsReviewed!==true||!citation(r)||String(r.publishedAt)<share.filedAt)return fail('Share class, a positive listed-share ratio, dated SEC citation and explicit equity-claims review are required.');
  review={shareCountFactId:share.id,unitsPerListedShare:r.unitsPerListedShare,shareClass:r.shareClass.trim(),source:'SEC',sourceUrl:r.sourceUrl as string,publishedAt:r.publishedAt as string,claimsReviewed:true};
 }
 if(!Array.isArray(raw.businessEvidence)||raw.businessEvidence.length>40)return fail('At most 40 cited business claims are accepted.');
 const claims:BusinessClaim[]=[];
 for(const c of raw.businessEvidence){
  if(!object(c)||!only(c,['id','dimension','kind','text','value','unit','periodEnd','publishedAt','source','sourceUrl','milestoneId','targetOperator','direction','evidenceIds']))return fail('Business claims contain unsupported fields.');
  if(!text(c.id,1,100)||!/^[A-Za-z0-9:_-]+$/.test(c.id)||claims.some(x=>x.id===c.id)||!dimensions.has(String(c.dimension))||!['REPORTED_FACT','MANAGEMENT_GUIDANCE'].includes(String(c.kind))||!text(c.text,20,1500)||!citation(c))return fail('Business claims require a unique ID, supported dimension/type and an exact current SEC source/date.');
  if(!Array.isArray(c.evidenceIds)||c.evidenceIds.length===0||c.evidenceIds.some(id=>typeof id!=='string'||!context.evidenceIds.includes(id)||!readIds.includes(id))||!context.sources.some(s=>s.url===c.sourceUrl&&s.publishedAt===c.publishedAt&&(c.evidenceIds as string[]).includes(s.id)))return fail('Each claim must reference the cited, reviewed current evidence ID.');
  if(c.value!==undefined&&(!number(c.value)||!text(c.unit,1,40)||!date(c.periodEnd)))return fail('A numerical claim requires a finite value, unit and a valid period end.');
  if(c.unit!==undefined&&!text(c.unit,1,40)||c.periodEnd!==undefined&&!date(c.periodEnd)||c.milestoneId!==undefined&&(!text(c.milestoneId,1,100)||!/^[A-Za-z0-9:_-]+$/.test(c.milestoneId))||c.targetOperator!==undefined&&!['AT_LEAST','AT_MOST','EXACT'].includes(String(c.targetOperator))||c.direction!==undefined&&!['POSITIVE','NEGATIVE'].includes(String(c.direction)))return fail('Claim units, dates, milestone or direction are invalid.');
  if(c.kind==='REPORTED_FACT'&&typeof c.periodEnd==='string'&&c.periodEnd>String(c.publishedAt))return fail('A reported result cannot postdate its publication.');
  if(c.kind==='MANAGEMENT_GUIDANCE'&&typeof c.periodEnd==='string'&&c.periodEnd<String(c.publishedAt))return fail('A guidance target must be dated on or after its publication.');
  claims.push({...c,text:c.text.trim(),source:'SEC'} as BusinessClaim);
 }
 if(!review&&!claims.length)return fail('Provide a listed-share review or at least one supported business claim.');
 return {ok:true,value:{evidenceRevision:context.evidenceRevision,readEvidenceIds:[...new Set(readIds)],citationsReviewed:true,reviewNotes:raw.reviewNotes.trim(),valuationReview:review,businessEvidence:claims}};
}
function database(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;}
export async function saveCompanySourceReview(input:{symbol:string;cik:string;reviewedBy:string;payload:CompanyReviewPayload}){
 const db=database();if(!db)return {state:'UNAVAILABLE' as const,reason:'Source-review storage is not configured.'};
 try{const {data,error}=await db.from(TABLE).insert({symbol:input.symbol,cik:input.cik,evidence_revision:input.payload.evidenceRevision,reviewed_by:input.reviewedBy,payload:input.payload}).select('id,created_at').single();if(error||!data)return {state:'UNAVAILABLE' as const,reason:'The source review was not saved. Review storage or its migration is unavailable.'};return {state:'SAVED' as const,id:data.id as string,createdAt:data.created_at as string};}catch{return {state:'UNAVAILABLE' as const,reason:'Source-review storage is temporarily unavailable.'};}
}
export async function mergeCompanySourceReview(symbol:string,company:any){
 const empty={valuationReview:undefined,businessEvidence:[] as BusinessClaim[],sourceReview:{state:'UNREVIEWED',reason:'An authorized reviewer must read the current SEC citations before these claims can be used.'},businessEvidenceAvailability:{state:'UNREVIEWED',reason:'Business-specific operating claims have not been reviewed against cited SEC disclosures.'}};
 const db=database();if(!db)return {...empty,sourceReview:{state:'UNAVAILABLE',reason:'Source-review storage is not configured.'}};
 try{
  const {data,error}=await db.from(TABLE).select('id,created_at,reviewed_by,evidence_revision,payload').eq('symbol',symbol).eq('cik',String(company.cik)).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(error)return {...empty,sourceReview:{state:'UNAVAILABLE',reason:'Source-review storage or its migration is unavailable.'}};
  if(!data)return empty;
  const context=buildReviewContext(symbol,company),validated=validateCompanySourceReview(data.payload,context);
  if(!validated.ok)return {...empty,sourceReview:{state:'STALE',id:data.id,reviewedAt:data.created_at,reason:validated.reason}};
  return {valuationReview:validated.value.valuationReview??undefined,businessEvidence:validated.value.businessEvidence,sourceReview:{state:'REVIEWED',id:data.id,reviewedAt:data.created_at,evidenceRevision:data.evidence_revision,reason:'An authorized reviewer checked the cited source. This review does not validate forecasts or investment outcomes.'},businessEvidenceAvailability:{state:validated.value.businessEvidence.length?'REVIEWED':'UNREVIEWED',reason:validated.value.businessEvidence.length?'Dated SEC claims were reviewed and retain their reported or management-guidance classification.':'Listed shares were reviewed; business-specific operating claims remain unreviewed.'}};
 }catch{return {...empty,sourceReview:{state:'UNAVAILABLE',reason:'Source-review storage is temporarily unavailable.'}};}
}
