import type {InstitutionalLongTermAction,InstitutionalNewMoneyAction,InstitutionalOwnerAction} from "../v931/domain";

export type CioScoreInputs={
  business:number|null;
  earningsRevisions:number|null;
  valuation:number|null;
  marketStructure:number|null;
  catalystsRegime:number|null;
  riskAsymmetry:number|null;
};

export type CioTechnicalInputs={
  trend:number;
  momentum:number;
  flow:number;
  structure:number;
  structuralBreak:boolean;
};

export type AurynCioAssessment={
  compounderQuality:number;
  deterioration:{score:number;state:"STABLE"|"WATCH"|"DETERIORATING"|"SEVERE";corroboratingWeaknesses:string[]};
  deploymentQuality:number;
  agreement:number;
  confidence:number;
  newMoneyAction:InstitutionalNewMoneyAction;
  ownerAction:InstitutionalOwnerAction;
  longTermAction:InstitutionalLongTermAction;
  upgradeConditions:string[];
  downgradeConditions:string[];
  rationale:string[];
};
