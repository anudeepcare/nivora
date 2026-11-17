import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { requestAccess, reserveAccess } from "@/lib/access-server";
import { projectResearch } from "@/lib/access-policy";
import { research, researchSymbol } from "@/lib/providers";
import { workspaceGuidance } from "@/lib/edge-research";

const summaries = new Map<string, { at: number; value: Promise<unknown> }>();
// Small batches reuse provider caches; this endpoint never bypasses plan checks.
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`pace-scan:${user.id}`, 30);
    const symbols = [
      ...new Set(
        (new URL(request.url).searchParams.get("symbols") ?? "")
          .split(",")
          .filter(Boolean)
          .map(researchSymbol),
      ),
    ];
    if (!symbols.length || symbols.length > 2)
      throw new HttpError("Choose one or two symbols.", 400);
    const access = await requestAccess(request, user.id);
    const rows = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          await reserveAccess(user.id, access, "research", symbol);
          const key = JSON.stringify([symbol, access.features]);
          const old = summaries.get(key);
          let value =
            old && Date.now() - old.at < 900000 ? old.value : undefined;
          if (!value) {
            value = research(symbol)
              .then((raw) => {
                const r = projectResearch(raw, access);
                return {
                  signal: workspaceGuidance(r, true, Date.now()),
                  entrySignal: workspaceGuidance(r, false, Date.now()),
                  checkedAt: new Date().toISOString(),
                };
              })
              .catch((error) => {
                summaries.delete(key);
                throw error;
              });
            summaries.set(key, { at: Date.now(), value });
            if (summaries.size > 512)
              summaries.delete(summaries.keys().next().value!);
          }
          return [symbol, await value];
        } catch {
          return [symbol, { error: "Reading unavailable" }];
        }
      }),
    );
    return privateJson(Object.fromEntries(rows));
  } catch (error) {
    return failure(error);
  }
}
