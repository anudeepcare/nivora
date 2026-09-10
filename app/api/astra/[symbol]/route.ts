import {NextResponse} from "next/server";
import {buildAstraRequest,validateAstraAnalysis,type AstraAnalysis} from "@/lib/auryn/v931/astra";
import type {GroundedEvidence} from "@/lib/auryn/v931/domain";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";

export const dynamic="force-dynamic";
function outputText(body:any){if(typeof body?.output_text==='string')return body.output_text;for(const item of body?.output||[])for(const c of item?.content||[])if(c?.type==='output_text'&&typeof c?.text==='string')return c.text;return null;}
export async function POST(req:Request,{params}:{params:Promise<{symbol:string}>}){
 const rl=await rateLimitDistributed(`astra:${requestKey(req)}`,12,60_000);if(!rl.ok)return NextResponse.json({status:'blocked',reason:'Astra request limit reached.'},{status:429});
 const key=process.env.OPENAI_API_KEY||'';if(!key)return NextResponse.json({status:'unavailable',reason:'OPENAI_API_KEY is not configured. Deterministic AURYN remains active.'},{status:503});
 const {symbol:raw}=await params;const symbol=decodeURIComponent(raw).toUpperCase();const b=await req.json().catch(()=>null);
 const snapshotId=String(b?.snapshotId||'').slice(0,180),canonicalAction=String(b?.canonicalAction||'').slice(0,40);const evidence:Array<GroundedEvidence>=Array.isArray(b?.evidence)?b.evidence.slice(0,40).map((e:any)=>({id:String(e?.id||'').slice(0,80),text:String(e?.text||'').slice(0,500),values:Array.isArray(e?.values)?e.values.map(Number).filter(Number.isFinite).slice(0,12):[],horizon:String(e?.horizon||'').slice(0,40),asOf:e?.asOf?String(e.asOf).slice(0,40):null,source:e?.source?String(e.source).slice(0,120):null})).filter((e:any)=>e.id&&e.text):[];
 if(!snapshotId||!canonicalAction||!evidence.length)return NextResponse.json({status:'blocked',reason:'Canonical snapshot, action and grounded evidence are required.'},{status:400});
 const requestBody=buildAstraRequest({symbol,snapshotId,canonicalAction,evidence});
 try{
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(requestBody),cache:'no-store',signal:AbortSignal.timeout(30000)});
  const body=await r.json().catch(()=>null);if(!r.ok)return NextResponse.json({status:'unavailable',reason:body?.error?.message||`Astra API ${r.status}. Deterministic AURYN remains active.`},{status:502});
  const text=outputText(body);if(!text)return NextResponse.json({status:'blocked',reason:'Astra returned no structured analysis.'},{status:502});
  const analysis=JSON.parse(text) as AstraAnalysis;const validation=validateAstraAnalysis(analysis,evidence,canonicalAction);
  if(!validation.ok)return NextResponse.json({status:'blocked',reason:'Astra output failed AURYN grounding validation.',issues:validation.issues},{status:422});
  return NextResponse.json({status:'grounded',model:'gpt-6-astra',snapshotId,canonicalAction,analysis,validation},{headers:{'Cache-Control':'private, no-store, max-age=0'}});
 }catch(e:any){return NextResponse.json({status:'unavailable',reason:e?.name==='AbortError'?'Astra timed out; deterministic AURYN remains active.':e?.message||'Astra is temporarily unavailable.'},{status:502});}
}
