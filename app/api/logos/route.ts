import { account, failure, limit, privateJson } from "@/lib/server";
import { symbolInput } from "@/lib/format";
import { companyLogo } from "@/lib/company-profiles";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    limit(`logos:${user.id}`, 12);
    const symbols = [
      ...new Set(
        (new URL(request.url).searchParams.get("symbols") || "")
          .split(",")
          .filter(Boolean)
          .slice(0, 20)
          .map(symbolInput),
      ),
    ];
    const results: Record<string, string | null> = {};
    let index = 0;
    await Promise.all(
      Array.from({ length: Math.min(3, symbols.length) }, async () => {
        while (index < symbols.length) {
          const symbol = symbols[index++];
          const p = await companyLogo(symbol);
          results[symbol] = p.logoUrl;
        }
      }),
    );
    return privateJson(results);
  } catch (e) {
    return failure(e);
  }
}
