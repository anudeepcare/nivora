import { eodEnrichment } from "./eodhd";
const cache = new Map<string, { until: number; value: Enrichment }>();
export type Enrichment = {
  symbol: string;
  profile: {
    name: string;
    industry: string;
    website: string;
    logo: string;
  } | null;
  insiders: {
    name: string;
    date: string;
    filed: string;
    code: string;
    action: string;
    change: number;
    price: number | null;
  }[];
  earnings: {
    date: string;
    hour: string;
    epsActual: number | null;
    epsEstimate: number | null;
    revenueActual: number | null;
    revenueEstimate: number | null;
  }[];
  issues: string[];
  retrievedAt: string;
  source: string;
};
export async function enrich(symbol: string): Promise<Enrichment> {
  return eodEnrichment(symbol);
}
