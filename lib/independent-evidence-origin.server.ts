import "server-only";
import { account, HttpError, limit } from "./server";
import {
  accessEnabled,
  requestAccess,
  requireFeature,
  reserveAccess,
} from "./access-server";
import {
  allowMarketUser,
  sharedMarketEnabled,
  sharedEodEvidenceRead,
  pauseSharedEod,
} from "./shared-market";
import {
  collectIndependentPriceEvidence,
  independentSecurityFrom,
  independentAdjustedRows,
  validIndependentEvidenceRequest,
  type IndependentEvidenceRequest,
} from "./independent-pace-adapter";
import {
  cachePayloadHash,
  inspectCacheEvidence,
} from "./cache-evidence-provenance";
import { canonicalMarketKey } from "./market-policy";
import { researchSymbol } from "./providers";
type Envelope = {
  schema: "independent-evidence-v1";
  data: unknown;
  metadata: {
    version: 1;
    origin: "provider-network";
    requestKey: string;
    fetchedAt: string;
    expiresAt: string;
    payloadHash: string;
  };
};
type Receipt = {
  requestKey: string;
  responseReceivedAt: string;
  expiresAt: string;
  payloadHash: string;
};
function immutableJSON<T>(value: T): T {
  const copy = JSON.parse(JSON.stringify(value)) as T;
  let count = 0;
  const freeze = (v: unknown, depth: number): void => {
    if (++count > 100000 || depth > 64)
      throw new HttpError("Evidence structure exceeds safe bounds.", 503);
    if (v && typeof v === "object") {
      for (const child of Object.values(v)) freeze(child, depth + 1);
      Object.freeze(v);
    }
  };
  freeze(copy, 0);
  return copy;
}
async function boundedJSON(response: Response): Promise<unknown> {
  const max = 2 * 1024 * 1024;
  if (Number(response.headers.get("content-length")) > max || !response.body)
    throw new HttpError(
      "Evidence response size is unavailable or excessive.",
      503,
    );
  const reader = response.body.getReader(),
    decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0,
    text = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > max)
        throw new HttpError("Evidence response exceeds safe bounds.", 503);
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}
/** No route or client consumer. Auth precedes every cache read. This is receipt
 * provenance, not source observation freshness, business eligibility or Pace. */
export async function readIndependentOriginEvidence(
  request: Request,
  input: IndependentEvidenceRequest,
) {
  const query = Object.freeze({ ...input });
  const { user } = await account(request, { market: false });
  if (!validIndependentEvidenceRequest(query))
    throw new HttpError("Invalid bounded evidence request.", 400);
  if (!accessEnabled() || !sharedMarketEnabled())
    throw new HttpError(
      "Verified access and shared market protection are required.",
      503,
    );
  const access = await requestAccess(request, user.id);
  if (access.sampleOnly)
    throw new HttpError("Market data entitlement is unavailable.", 403);
  requireFeature(access, "technicals");
  if (Date.parse(query.to) - Date.parse(query.from) > 366 * 86400000)
    requireFeature(access, "longHistory");
  const token = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN;
  if (!token) throw new HttpError("Market data is not configured.", 503);
  await limit(`independent-evidence:${user.id}`, 12);
  if (!(await allowMarketUser(user.id)))
    throw new HttpError("Daily research allowance reached.", 429);
  await reserveAccess(
    user.id,
    access,
    "research",
    researchSymbol(query.providerTicker),
  );
  const receipts: Readonly<Receipt>[] = [];
  const evidence = await collectIndependentPriceEvidence(
    async (path, params, ttl) => {
      const key = canonicalMarketKey(path, params);
      const validateExpected = (data: unknown) => {
        const valid =
          path === `v1.1/fundamentals/${query.providerTicker}`
            ? independentSecurityFrom(data, query.providerTicker)
            : path === `eod/${query.providerTicker}`
              ? independentAdjustedRows(data, query)
              : null;
        if (!valid)
          throw new HttpError(
            "Provider identity or adjusted-price evidence is invalid.",
            503,
          );
      };
      const raw = await sharedEodEvidenceRead(
        token,
        path,
        params,
        ttl,
        async (): Promise<Envelope> => {
          const response = await fetch(
            `https://eodhd.com/api/${path}?${new URLSearchParams({ ...params, api_token: token, fmt: "json" })}`,
            {
              cache: "no-store",
              redirect: "error",
              signal: AbortSignal.timeout(15000),
              headers: { Accept: "application/json" },
            },
          );
          const receivedAt = new Date().toISOString();
          if (response.status === 429 || response.status === 402) {
            const delay = Number(response.headers.get("retry-after"));
            const seconds =
              response.status === 402
                ? Math.max(
                    1,
                    Math.ceil(
                      (Date.parse(
                        new Date(Date.now() + 86400000)
                          .toISOString()
                          .slice(0, 10),
                      ) -
                        Date.now()) /
                        1000,
                    ),
                  )
                : Math.max(
                    1,
                    Math.min(
                      3600,
                      Number.isFinite(delay) && delay > 0 ? delay : 60,
                    ),
                  );
            await pauseSharedEod(token, seconds);
            throw new HttpError(
              "Provider updates are temporarily limited.",
              503,
            );
          }
          if (!response.ok)
            throw new HttpError("Provider evidence is unavailable.", 503);
          const data = immutableJSON(await boundedJSON(response));
          if (
            !data ||
            typeof data !== "object" ||
            (Array.isArray(data) && data.length === 0) ||
            (!Array.isArray(data) && ("error" in data || "errors" in data))
          )
            throw new HttpError("Invalid provider evidence.", 503);
          validateExpected(data);
          const payloadHash = cachePayloadHash(data);
          if (!payloadHash)
            throw new HttpError("Evidence fingerprint is unavailable.", 503);
          return immutableJSON({
            schema: "independent-evidence-v1",
            data,
            metadata: {
              version: 1,
              origin: "provider-network",
              requestKey: key,
              fetchedAt: receivedAt,
              expiresAt: new Date(Date.parse(receivedAt) + ttl).toISOString(),
              payloadHash,
            },
          } as Envelope);
        },
      );
      // Snapshot first: a status/hash must never certify a subsequently mutable reference.
      const envelope = immutableJSON(raw) as Envelope;
      if (envelope?.schema !== "independent-evidence-v1" || !envelope.metadata)
        throw new HttpError(
          "Legacy evidence has no verified origin envelope.",
          503,
        );
      const inspection = inspectCacheEvidence(
        envelope.data,
        envelope.metadata,
        key,
        new Date().toISOString(),
        ttl,
      );
      if (inspection.status !== "within-declared-window")
        throw new HttpError("Evidence receipt is invalid or stale.", 503);
      validateExpected(envelope.data);
      receipts.push(
        Object.freeze({
          requestKey: key,
          responseReceivedAt: envelope.metadata.fetchedAt,
          expiresAt: envelope.metadata.expiresAt,
          payloadHash: envelope.metadata.payloadHash,
        }),
      );
      return envelope.data;
    },
    query,
  );
  return Object.freeze({
    readyForPace: false as const,
    evidence,
    receipts: Object.freeze(receipts),
  });
}
