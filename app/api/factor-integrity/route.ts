import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {factorCorrelationAudit,uniqueInformationBudget} from "@/lib/nivora-factor-integrity";
import {ENGINE_VERSION} from "@/lib/nivora-version";
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return NextResponse.json({status:"unavailable"},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const{data}=await db.from("nivora_decision_history").select("company_score,growth_score,financial_score,analyst_score,valuation_score,thesis_score,opportunity_score,engine_version").eq("engine_version",ENGINE_VERSION).limit(5000);
 const rows=(data||[]).map((r:any)=>({company:r.company_score,growth:r.growth_score,financial:r.financial_score,street:r.analyst_score,valuation:r.valuation_score,thesis:r.thesis_score,opportunity:r.opportunity_score}));
 const factors=["company","growth","financial","street","valuation"];
 const correlations=factorCorrelationAudit(rows,factors);
 return NextResponse.json({status:rows.length>=50?"active":"collecting",n:rows.length,correlations,uniqueInformationBudget:uniqueInformationBudget(correlations),note:"NIVORA monitors factor-family correlation before applying any orthogonalization. Correlation findings are diagnostic and do not automatically change ratings."},{headers:{"Cache-Control":"private, max-age=900"}})
}
