import { alpacaOptions } from "./alpaca-options";
import { type OptionContract } from "./options-analysis";
import { HttpError } from "./server";
/** Reject a source mixing another underlying or inconsistent standard-contract metadata. */
export function validateOptionScope(
  contracts: OptionContract[],
  ticker: string,
  expiry: string | null,
) {
  for (const c of contracts) {
    const m = /^([A-Z.]+)(\d{6})([CP])(\d{8})$/.exec(c.id);
    if (
      m &&
      (m[1] !== ticker ||
        `20${m[2].slice(0, 2)}-${m[2].slice(2, 4)}-${m[2].slice(4, 6)}` !==
          c.expiry ||
        Number(m[4]) / 1000 !== c.strike ||
        (m[3] === "C" ? "call" : "put") !== c.type)
    )
      throw new HttpError(
        "The options source returned inconsistent contract identities.",
        503,
      );
    if ((c.standard && !m) || (expiry && c.expiry !== expiry))
      throw new HttpError(
        "The options source returned contracts outside the requested scope.",
        503,
      );
  }
  return contracts;
}
/** The two-provider subscription does not establish contract-chain Marketplace rights.
 * SentiSense's dossier is aggregate evidence, never an executable bid/ask chain.
 * Existing explicitly enabled Alpaca production access is retained; Marketplace is not auto-enabled.
 */
export async function loadOptionChain(
  _ticker: string,
  expiry: string | null = null,
) {
  if (
    expiry &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
      !Number.isFinite(Date.parse(expiry)) ||
      new Date(expiry).toISOString().slice(0, 10) !== expiry)
  )
    throw new HttpError("Choose a valid expiry.");
  if (
    process.env.AURYN_OPTIONS_ENABLED === "true" &&
    [undefined, "", "alpaca"].includes(process.env.AURYN_OPTIONS_PROVIDER)
  ) {
    try {
      const chain = await alpacaOptions(_ticker, expiry);
      validateOptionScope(chain.contracts, _ticker, expiry);
      return chain;
    } catch (error) {
      throw new HttpError(
        error instanceof Error ? error.message : "Options unavailable.",
        503,
      );
    }
  }
  return {
    status: "unavailable",
    message:
      "Contract quotes and Greeks are not connected. Company positioning includes aggregate observations and history, not executable option quotes.",
    contracts: [] as OptionContract[],
    complete: false,
  };
}
