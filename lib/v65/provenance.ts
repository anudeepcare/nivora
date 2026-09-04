import type { MetricProvenance, MetricValidationState } from "./domain";

export function buildMetricProvenance<T>(args: {
  value: T;
  previousValue?: T;
  evidenceAsOf: string;
  changedBecause: string[];
  validationState: MetricValidationState;
  lastMeaningfulChangeAt?: string;
  sourceIds?: string[];
}): MetricProvenance<T> {
  return { ...args };
}
