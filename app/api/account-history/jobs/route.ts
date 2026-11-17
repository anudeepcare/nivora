import { createClient } from "@supabase/supabase-js";
import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { eodRequest } from "@/lib/eodhd";
import { AccountHistoryError } from "@/lib/account-history";
import {
  advanceHistoryJob,
  createHistoryJob,
  HISTORY_JOB_VERSION,
  historyLedgerDigest,
  type HistoryJobState,
} from "@/lib/account-history-job";
export const maxDuration = 60;
function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new HttpError("History job storage is not configured.", 503);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
type Job = {
  id: string;
  revision: number;
  state: HistoryJobState;
  result: unknown;
  expires_at: string;
  lease_token: string;
};
function response(job: Job, retry = false) {
  return privateJson({
    id: job.id,
    revision: job.revision,
    completed: job.state.tasks.filter((t) => t.done).length,
    total: job.state.tasks.length,
    result: job.result,
    retry,
  });
}
export async function POST(request: Request) {
  try {
    const { user, db } = await account(request, { market: true });
    await limit(`history-job:${user.id}`, 120);
    const text = await request.text();
    if (text.length > 1024) throw new HttpError("Request too large.", 413);
    const body = JSON.parse(text);
    if (body.confirmComplete !== true || !Number.isSafeInteger(body.revision))
      throw new HttpError("Review and confirm the saved ledger first.", 400);
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
    const admin = storage();
    if (!body.id) {
      const state = createHistoryJob(saved.data.rows),
        through = new Date(state.now - 86400000).toISOString().slice(0, 10);
      // Expired evidence is discarded, never silently reused with a new snapshot.
      const expired = await admin
        .from("auryn_account_history_jobs")
        .delete()
        .eq("user_id", user.id)
        .lte("expires_at", new Date().toISOString());
      if (expired.error)
        throw new HttpError(
          "History jobs require the account-history database migration.",
          503,
        );
      const created = await admin.from("auryn_account_history_jobs").upsert(
        {
          user_id: user.id,
          revision: body.revision,
          through,
          algorithm_version: HISTORY_JOB_VERSION,
          state,
          ledger_snapshot: saved.data.rows,
        },
        {
          onConflict: "user_id,revision,through,algorithm_version",
          ignoreDuplicates: true,
        },
      );
      if (created.error)
        throw new HttpError("History job could not be created.", 503);
      const found = await admin
        .from("auryn_account_history_jobs")
        .select("id,revision,state,result,expires_at,lease_token")
        .eq("user_id", user.id)
        .eq("revision", body.revision)
        .eq("through", through)
        .eq("algorithm_version", HISTORY_JOB_VERSION)
        .single();
      if (found.error || !found.data)
        throw new HttpError("History job unavailable.", 503);
      const job = found.data as Job;
      if (job.state.ledgerDigest !== historyLedgerDigest(saved.data.rows))
        throw new HttpError(
          "Ledger changed. Save a new ledger revision before rebuilding history.",
          409,
        );
      return response(job);
    }
    if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id))
      throw new HttpError("Invalid history job.", 400);
    const found = await admin
      .from("auryn_account_history_jobs")
      .select("id,revision,state,result,expires_at,lease_token")
      .eq("id", body.id)
      .eq("user_id", user.id)
      .eq("revision", body.revision)
      .maybeSingle();
    if (found.error)
      throw new HttpError("History job storage unavailable.", 503);
    if (!found.data) throw new HttpError("History job not found.", 404);
    const job = found.data as Job;
    if (Date.parse(job.expires_at) <= Date.now())
      throw new HttpError(
        "History evidence expired. Review the ledger and restart.",
        409,
      );
    if (job.state.ledgerDigest !== historyLedgerDigest(saved.data.rows))
      throw new HttpError(
        "Ledger changed. Save a new ledger revision before rebuilding history.",
        409,
      );
    if (job.result) return response(job);
    const claim = await admin.rpc("auryn_claim_account_history", {
      p_id: job.id,
      p_user: user.id,
      p_revision: body.revision,
    });
    if (claim.error)
      throw new HttpError("History job could not be claimed.", 503);
    const leased = claim.data?.[0] as Job | undefined;
    if (!leased)
      throw new HttpError(
        "History is already updating or the ledger changed. Retry after reviewing the ledger.",
        409,
      );
    const out = await advanceHistoryJob(
      saved.data.rows,
      leased.state,
      eodRequest,
    );
    const result = out.result
      ? { ...out.result, revision: body.revision }
      : null;
    const commit = await admin.rpc("auryn_save_account_history", {
      p_id: job.id,
      p_user: user.id,
      p_revision: body.revision,
      p_lease: leased.lease_token,
      p_state: out.state,
      p_result: result,
    });
    if (commit.error)
      throw new HttpError(
        "History progress could not be saved. Retry safely.",
        503,
      );
    if (commit.data !== true)
      throw new HttpError(
        "Ledger changed or history lease expired. Review the ledger before retrying.",
        409,
      );
    return response({ ...job, state: out.state, result }, out.retry);
  } catch (e) {
    return failure(
      e instanceof AccountHistoryError ? new HttpError(e.message, 422) : e,
    );
  }
}
