import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { accountHistory, AccountHistoryError } from "@/lib/account-history";
import { eodRequest } from "@/lib/eodhd";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { user, db } = await account(request, { market: true });
    await limit(`account-history:${user.id}`, 3);
    const raw = await request.text();
    if (raw.length > 1024) throw new HttpError("Request too large.", 413);
    const body = JSON.parse(raw);
    if (body.confirmComplete !== true || !Number.isSafeInteger(body.revision))
      throw new HttpError(
        "Confirm the current saved ledger before calculating history.",
        400,
      );
    const saved = await db
      .from("auryn_transaction_ledgers")
      .select("rows,revision")
      .eq("user_id", user.id)
      .maybeSingle();
    if (saved.error)
      throw new HttpError("Transaction storage unavailable.", 503);
    if (!saved.data || saved.data.revision !== body.revision)
      throw new HttpError(
        "Reload transactions before calculating history.",
        409,
      );
    const result = await accountHistory(saved.data.rows, true, eodRequest);
    return privateJson({ ...result, revision: saved.data.revision });
  } catch (e) {
    return failure(
      e instanceof AccountHistoryError ? new HttpError(e.message, 422) : e,
    );
  }
}
