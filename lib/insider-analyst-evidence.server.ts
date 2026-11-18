import "server-only";
import {
  evidenceSymbol,
  projectEvidence,
  type EvidenceKind,
} from "./insider-analyst-evidence";
import { HttpError, limit } from "./server";
export async function readInsiderAnalystEvidence(
  symbol: string,
  kind: EvidenceKind,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  if (!evidenceSymbol(symbol) || !["clusters", "calls"].includes(kind))
    throw new HttpError("Invalid evidence request.", 400);
  if (!key) throw new HttpError("Evidence provider is not configured.", 503);
  await limit("sentisense:insider-analyst-evidence", 20);
  const path =
    kind === "clusters"
      ? "/insider/cluster-buys?lookbackDays=90"
      : `/analyst/${encodeURIComponent(symbol)}/called-it?limit=10`;
  let response: Response;
  try {
    response = await fetcher(`https://app.sentisense.ai/api/v1${path}`, {
      headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new HttpError("Evidence provider could not be reached.", 503);
  }
  if (response.status === 401 || response.status === 403)
    throw new HttpError("The provider key cannot access this evidence.", 403);
  if (response.status === 404)
    throw new HttpError(
      "The provider does not have this evidence for the requested stock.",
      404,
    );
  if (response.status === 429)
    throw new HttpError(
      "Provider limit reached. Wait before requesting again.",
      429,
    );
  if (!response.ok)
    throw new HttpError("Evidence is temporarily unavailable.", 503);
  let raw: unknown;
  try {
    const body = await response.text();
    if (body.length > 2000000) throw Error();
    raw = JSON.parse(body);
  } catch {
    throw new HttpError("Provider evidence could not be read.", 502);
  }
  const result = projectEvidence(raw, kind, symbol);
  if (!result)
    throw new HttpError(
      "Provider evidence has an unsupported format or identity.",
      502,
    );
  return {
    ...result,
    source: "SentiSense",
    retrievedAt: new Date().toISOString(),
  };
}
