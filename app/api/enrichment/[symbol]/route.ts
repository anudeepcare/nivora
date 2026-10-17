import { account, failure, HttpError, privateJson, limit } from "@/lib/server";
import { enrich } from "@/lib/enrichment";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request);
    limit(`enrich:${user.id}`, 15);
    const { symbol } = await params;
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol))
      throw new HttpError(
        "Events coverage is limited to supported US equity symbols.",
      );
    return privateJson(await enrich(symbol));
  } catch (e) {
    return failure(e);
  }
}
