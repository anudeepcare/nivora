import { account, failure, privateJson } from "@/lib/server";
import { sentisenseEnabled } from "@/lib/sentisense-api";
import { eodEnabled } from "@/lib/eodhd";
export async function GET(request: Request) {
  try {
    await account(request, { market: false });
    return privateJson({
      marketProvider: eodEnabled() ? "eodhd" : "none",
      configured: eodEnabled(),
      researchProvider: sentisenseEnabled() ? "sentisense" : "none",
      aiConfigured:
        process.env.AURYN_AI_ENABLED === "true" &&
        Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL),
      verification:
        "Configuration only; this does not validate the API token or live coverage.",
    });
  } catch (e) {
    return failure(e);
  }
}
