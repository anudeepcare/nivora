import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { quote } from "@/lib/providers";
import { symbolInput } from "@/lib/format";
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    limit(`quotes:${user.id}`, 20);
    const result: Record<string, unknown> = Object.create(null);
    const symbols: string[] = [];
    const requested = [
      ...new Set(
        (new URL(request.url).searchParams.get("symbols") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ].slice(0, 30);
    for (const raw of requested) {
      try {
        const symbol = symbolInput(raw);
        if (!symbols.includes(symbol)) symbols.push(symbol);
      } catch {
        result[raw] = {
          error: "Invalid symbol. Edit or remove this saved ticker.",
        };
      }
    }
    let index = 0;
    await Promise.all(
      Array.from({ length: Math.min(3, symbols.length) }, async () => {
        while (index < symbols.length) {
          const symbol = symbols[index++];
          try {
            result[symbol] = await quote(symbol);
          } catch (e) {
            result[symbol] = {
              error:
                e instanceof HttpError
                  ? e.message
                  : "Quote unavailable. Retry this symbol.",
            };
          }
        }
      }),
    );
    return privateJson(result);
  } catch (e) {
    return failure(e);
  }
}
