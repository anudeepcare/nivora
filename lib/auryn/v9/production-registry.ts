export function createProductionFeatureRegistry(input:{version:string;candidates:Array<{featureId:string;status:string;promotion?:{eligible?:boolean}}>;approvedFeatureIds:string[]}){
 const approved=new Set(input.approvedFeatureIds);
 const featureIds=input.candidates.filter(c=>approved.has(c.featureId)&&c.status==='PRODUCTION_CANDIDATE'&&c.promotion?.eligible===true).map(c=>c.featureId).sort();
 return{version:input.version,featureIds,featureCount:featureIds.length,autoPromoted:false,createdFromExplicitApprovals:true};
}
