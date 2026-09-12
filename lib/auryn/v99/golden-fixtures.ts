import {buildAurynCioAssessment} from "../v97/cio-engine";
export type GoldenFixture={id:string;input:Parameters<typeof buildAurynCioAssessment>[0];expected:string[]};
const t=(x:Partial<{trend:number;momentum:number;flow:number;structure:number;structuralBreak:boolean}>={})=>({trend:65,momentum:62,flow:58,structure:66,structuralBreak:false,...x});
export const GOLDEN_FIXTURES:GoldenFixture[]=[
 {id:"exceptional-compounder",input:{scores:{business:94,earningsRevisions:88,valuation:82,marketStructure:80,catalystsRegime:75,riskAsymmetry:82},technical:t({trend:82,momentum:78,flow:74,structure:84}),evidenceCompleteness:96},expected:["STRONG_BUY","ATTRACTIVE"]},
 {id:"great-business-expensive",input:{scores:{business:91,earningsRevisions:82,valuation:35,marketStructure:58,catalystsRegime:62,riskAsymmetry:48},technical:t({trend:60,momentum:55,flow:50,structure:60}),evidenceCompleteness:92},expected:["WAIT","ATTRACTIVE"]},
 {id:"credible-starter",input:{scores:{business:82,earningsRevisions:76,valuation:62,marketStructure:58,catalystsRegime:58,riskAsymmetry:60},technical:t({trend:58,momentum:54,flow:50,structure:60}),evidenceCompleteness:87},expected:["START_SMALL","ATTRACTIVE"]},
 {id:"deteriorating-business",input:{scores:{business:27,earningsRevisions:24,valuation:72,marketStructure:32,catalystsRegime:35,riskAsymmetry:25},technical:t({trend:30,momentum:28,flow:32,structure:30,structuralBreak:true}),evidenceCompleteness:91},expected:["AVOID","UNATTRACTIVE"]}
];
