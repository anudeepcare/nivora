import { canonical } from "@/lib/canonical";
import { account, failure, limit, privateJson } from "@/lib/server";
import { research } from "@/lib/providers";
import { symbolInput } from "@/lib/format";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request);
    limit(`research:${user.id}`, 12);
    const symbol = symbolInput((await params).symbol);
    const data = await research(symbol);
    return privateJson({ ...data, snapshot: canonical(data) });
  } catch (e) {
    return failure(e);
  }
}
