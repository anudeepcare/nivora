import { account, failure, limit, privateJson } from "@/lib/server";
import { symbolInput } from "@/lib/format";
import { eodNews } from "@/lib/eodhd";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    limit(`news:${user.id}`, 15);
    const symbol = symbolInput(
      new URL(request.url).searchParams.get("symbol") ?? "",
    );
    return privateJson(await eodNews(symbol));
  } catch (e) {
    return failure(e);
  }
}
