export const VALUATION_MODEL_VERSION = "valuation@1.0.0" as const;

export type ValuationStatus =
  | "ok"
  | "low-confidence"
  | "range-only"
  | "refused";

export type ValuationCase = {
  value: number | null;
  vsPrice: number | null;
  g0: number | null;
  margin: number | null;
  rate: number | null;
  gT: number | null;
};

export type ValuationMethod = {
  id: string;
  weight: number;
  confidence: number;
  value: number | null;
};

export type ValuationFacts = {
  netCash: number | null;
  runwayMonths: number | null;
  dilution3y: number | null;
  cashPerShare: number | null;
};

export type ValuationAudit = {
  rf: number | null;
  betaAdj: number | null;
  erp: number | null;
  sizePremium: number | null;
  wacc: number | null;
  tvShare: number | null;
};

export type ValuationOutput = {
  symbol: string;
  asOf: string;
  status: ValuationStatus;
  family: string;
  routeRule: number;
  methods: ValuationMethod[];
  price: number | null;
  cases: {
    bear: ValuationCase;
    base: ValuationCase;
    bull: ValuationCase;
  };
  impliedGrowth: number | null;
  deliveredGrowth: number | null;
  confidence: number;
  dataQuality: number;
  flags: string[];
  refusalReason: string | null;
  facts: ValuationFacts;
  audit: ValuationAudit;
  traceId: string;
  modelVersion: string;
  configHash: string;
};

type RecordValue = Record<string, unknown>;

function record(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function finiteOrNull(value: unknown): boolean {
  return value === null || finite(value);
}

function checkCase(value: unknown, path: string, errors: string[]) {
  if (!record(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const field of ["value", "vsPrice", "g0", "margin", "rate", "gT"]) {
    if (!finiteOrNull(value[field])) errors.push(`${path}.${field} must be finite or null`);
  }
}

export function validateValuationOutput(value: unknown): string[] {
  const errors: string[] = [];
  if (!record(value)) return ["output must be an object"];

  for (const field of ["symbol", "asOf", "family", "traceId", "modelVersion", "configHash"]) {
    if (typeof value[field] !== "string" || value[field] === "") {
      errors.push(`${field} must be a non-empty string`);
    }
  }
  if (!["ok", "low-confidence", "range-only", "refused"].includes(String(value.status))) {
    errors.push("status is unsupported");
  }
  if (!Number.isInteger(value.routeRule) || Number(value.routeRule) < 0) {
    errors.push("routeRule must be a non-negative integer");
  }
  if (!finiteOrNull(value.price)) errors.push("price must be finite or null");
  for (const field of ["impliedGrowth", "deliveredGrowth", "confidence", "dataQuality"]) {
    if (["impliedGrowth", "deliveredGrowth"].includes(field) ? !finiteOrNull(value[field]) : !finite(value[field])) errors.push(`${field} must be finite or null`);
  }
  if (finite(value.confidence) && (value.confidence < 0 || value.confidence > 100)) {
    errors.push("confidence must be between 0 and 100");
  }
  if (finite(value.dataQuality) && (value.dataQuality < 0 || value.dataQuality > 100)) {
    errors.push("dataQuality must be between 0 and 100");
  }
  if (!Array.isArray(value.flags) || value.flags.some((flag) => typeof flag !== "string")) {
    errors.push("flags must be an array of strings");
  }
  if (value.refusalReason !== null && typeof value.refusalReason !== "string") {
    errors.push("refusalReason must be a string or null");
  }
  if (!record(value.cases)) errors.push("cases must be an object");
  else {
    checkCase(value.cases.bear, "cases.bear", errors);
    checkCase(value.cases.base, "cases.base", errors);
    checkCase(value.cases.bull, "cases.bull", errors);
  }
  if (!Array.isArray(value.methods)) errors.push("methods must be an array");
  else {
    value.methods.forEach((method, index) => {
      const path = `methods[${index}]`;
      if (!record(method)) {
        errors.push(`${path} must be an object`);
        return;
      }
      if (typeof method.id !== "string" || method.id === "") errors.push(`${path}.id must be a non-empty string`);
      for (const field of ["weight", "confidence"]) {
        if (!finite(method[field])) errors.push(`${path}.${field} must be finite`);
      }
      if (!finiteOrNull(method.value)) errors.push(`${path}.value must be finite or null`);
    });
  }
  for (const group of ["facts", "audit"]) {
    if (!record(value[group])) errors.push(`${group} must be an object`);
    else {
      const required = group === "facts" ? ["netCash", "runwayMonths", "dilution3y", "cashPerShare"] : ["rf", "betaAdj", "erp", "sizePremium", "wacc", "tvShare"];
      for (const field of required) if (!(field in value[group])) errors.push(`${group}.${field} is required`);
      Object.entries(value[group]).forEach(([field, nested]) => {
        if (!finiteOrNull(nested)) errors.push(`${group}.${field} must be finite or null`);
      });
    }
  }
  return errors;
}

