import { account, failure, limit, privateJson } from "@/lib/server";
import { quote } from "@/lib/providers";
import { symbolInput } from "@/lib/format";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    limit(`quotes:${user.id}`, 6);
    const symbols = [
      ...new Set(
        (new URL(request.url).searchParams.get("symbols") || "")
          .split(",")
          .filter(Boolean)
          .map(symbolInput),
      ),
    ].slice(0, 30);
    const result: Record<string, unknown> = {};
    let index = 0;
    await Promise.all(
      Array.from({ length: Math.min(3, symbols.length) }, async () => {
        while (index < symbols.length) {
          const symbol = symbols[index++];
          try {
            result[symbol] = await quote(symbol);
          } catch {
            result[symbol] = { error: "Quote unavailable" };
          }
        }
      }),
    );
    return privateJson(result);
  } catch (e) {
    return failure(e);
  }
}
