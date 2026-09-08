import {NextResponse} from 'next/server';
import {featureCatalogSummary} from '@/lib/auryn/v9/feature-registry';
import {AURYN_V9_RESEARCH_VERSION,AURYN_V9_PROMOTION_POLICY} from '@/lib/auryn/v9/version';

export async function GET(){
  const catalog=featureCatalogSummary();
  return NextResponse.json({
    version:AURYN_V9_RESEARCH_VERSION,
    state:'RESEARCH_ONLY',
    catalog,
    evidence:{testedFeatures:0,oosSurvivors:0,shadowCandidates:0,productionCandidates:0,promoted:0,note:'No historical observation dataset was supplied to this stateless summary endpoint. Candidate breadth is not evidence of alpha.'},
    promotion:{policy:AURYN_V9_PROMOTION_POLICY,automatic:false,requires:['chronological out-of-sample evidence','cost-adjusted positive alpha','positive 95% OOS lower bound','regime stability','false-discovery control','explicit approval']},
    productionCioMutation:false,
  });
}
