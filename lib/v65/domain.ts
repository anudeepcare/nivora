export type AssetType = "EQUITY" | "CRYPTO" | "CASH";

export type LongTermAction = "BUY" | "STARTER_BUY" | "HOLD" | "REDUCE" | "AVOID";
export type NewMoneyAction = "BUY_NOW" | "BUY_IN_ZONE" | "WAIT_FOR_CONFIRMATION" | "DO_NOT_CHASE" | "NO_NEW_CAPITAL";
export type OwnerAction = "ADD" | "HOLD" | "TRIM" | "EXIT";

export type MetricValidationState = "MEASURED" | "HEURISTIC" | "COLLECTING" | "UNAVAILABLE";

export interface MetricProvenance<T = number | null> {
  value: T;
  previousValue?: T;
  evidenceAsOf: string;
  lastMeaningfulChangeAt?: string;
  changedBecause: string[];
  validationState: MetricValidationState;
  sourceIds?: string[];
}

export interface DecisionHorizonView {
  longTerm: LongTermAction;
  newMoney: NewMoneyAction;
  owner: OwnerAction;
}

export interface V65Decision {
  symbol: string;
  assetType: Exclude<AssetType, "CASH">;
  actions: DecisionHorizonView;
  thesis: MetricProvenance<number>;
  companyQuality: MetricProvenance<number>;
  opportunity: MetricProvenance<number>;
  timing: MetricProvenance<number>;
  riskPressure: MetricProvenance<number>;
}

export type V65PortfolioAsset =
  | { assetType: "EQUITY"; symbol: string; quantity: number; averageCost?: number }
  | { assetType: "CRYPTO"; symbol: string; quantity: number; averageCost?: number }
  | { assetType: "CASH"; currency: string; amount: number };
