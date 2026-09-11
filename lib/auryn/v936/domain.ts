export interface OpportunityScores{
 business:number|null; earningsRevisions:number|null; valuation:number|null; marketStructure:number|null; catalystsRegime:number|null; riskAsymmetry:number|null;
 entryQuality:number|null; relativeStrength:number|null; participation:number|null; rewardRisk:number|null; volatilityRisk:number|null;
}
export interface ScenarioBalance{bull:number;base:number;bear:number;calibrated:false;label:string}
export interface OpportunityLens{
 opportunityScore:number;coverage:number;supports:string[];constraints:string[];scenarioBalance:ScenarioBalance;
}
