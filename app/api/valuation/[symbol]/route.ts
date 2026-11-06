import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { symbolInput } from "@/lib/format";

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { user, db } = await account(request);
    limit(`valuation:${user.id}`, 30);
    const symbol = symbolInput((await params).symbol);
    const today = new Date().toISOString().slice(0, 10);
    const result = await db.from("auryn_valuation_outputs").select("trace_id,symbol,as_of,model_version,config_hash,status,payload,review_status,created_at").eq("symbol", symbol).lte("as_of", today).order("as_of", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (result.error) throw new HttpError("Valuation output is unavailable. Apply the valuation governance migration.", 503);
    if (!result.data) throw new HttpError("No stored valuation is available for this symbol yet.", 404);
    return privateJson({ output: result.data.payload, asOf: result.data.as_of, traceId: result.data.trace_id, modelVersion: result.data.model_version, configHash: result.data.config_hash, reviewStatus: result.data.review_status });
  } catch (error) {
    return failure(error);
  }
}

