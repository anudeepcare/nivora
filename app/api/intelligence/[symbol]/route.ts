import { publicIntelligence } from "@/lib/intelligence-dto";
import { requestAccess, reserveAccess } from "@/lib/access-server";
import type { Feature } from "@/lib/access-policy";
import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { researchSymbol } from "@/lib/providers";
import {
  SENTISENSE_DATASETS,
  sentisenseRead,
  type SentiSenseDataset,
} from "@/lib/sentisense-api";
const features: Partial<Record<SentiSenseDataset, Feature>> = {
  consensus: "analysts",
  etfAnalyst: "analysts",
  etfHoldings: "advanced",
  estimates: "analysts",
  consensusHistory: "analysts",
  analystActions: "analysts",
  analystCoverage: "analysts",
  earningsReactions: "news",
  optionsHistory: "options",
  optionsIntraday: "options",
  ownershipHistory: "advanced",
  kpis: "financials",
  kpiTypes: "financials",
  fundamentalsCurrent: "financials",
  fundamentalsQuarterly: "financials",
  fundamentalsAnnual: "financials",
  profile: "business",
  shortInterest: "advanced",
  shortVolume: "advanced",
  float: "advanced",
  stockEtfs: "advanced",
  tickerStories: "news",
  earnings: "news",
  documents: "news",
  holders: "advanced",
  insiders: "advanced",
  politicians: "advanced",
  options: "options",
  filingChanges: "advanced",
};
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`intelligence:${user.id}`, 12);
    const dataset =
      new URL(request.url).searchParams.get("dataset") || "consensus";
    if (!SENTISENSE_DATASETS.includes(dataset as SentiSenseDataset))
      throw new HttpError("Select a supported intelligence section.", 400);
    const section = dataset as SentiSenseDataset;
    const symbol = researchSymbol((await params).symbol);
    const access = await requestAccess(request, user.id);
    if (
      access.enabled &&
      !(access.owner && !access.preview) &&
      !access.features[features[section] ?? "advanced"]
    )
      throw new HttpError(
        "This research section is not included in your access.",
        403,
      );
    await reserveAccess(user.id, access, "research", symbol);
    return privateJson(
      publicIntelligence(await sentisenseRead(symbol, section)),
    );
  } catch (error) {
    return failure(error);
  }
}
