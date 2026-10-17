import { account, failure, privateJson } from "@/lib/server";
import { eodEnabled } from "@/lib/eodhd";
export async function GET(request: Request) {
  try {
    await account(request);
    return privateJson({
      marketProvider: eodEnabled()
        ? process.env.TWELVE_DATA_API_KEY
          ? "hybrid"
          : "eodhd"
        : process.env.TWELVE_DATA_API_KEY
          ? "twelve"
          : "none",
      configured: eodEnabled() || Boolean(process.env.TWELVE_DATA_API_KEY),
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
