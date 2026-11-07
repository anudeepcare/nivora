export type ThesisLease = {
  user_id: string;
  symbol: string;
  lease_token: string;
};

/** Claims are ordered by due date in SQL; all outcomes move to the back of the queue. */
export async function runThesisQueue(deps: {
  enabled: boolean;
  claim: (limit: number) => Promise<ThesisLease[]>;
  eligible: (userId: string) => Promise<boolean>;
  check: (job: ThesisLease) => Promise<boolean>;
  finish: (job: ThesisLease, ok: boolean) => Promise<unknown>;
}) {
  if (!deps.enabled) return { enabled: false, processed: 0 };
  const jobs = await deps.claim(4);
  let processed = 0;
  for (const job of jobs.slice(0, 4)) {
    let ok = false;
    try {
      if (await deps.eligible(job.user_id)) ok = await deps.check(job);
    } catch {
      // A failing provider or account does not prevent the next account's turn.
    }
    try {
      await deps.finish(job, ok);
    } catch {
      // SQL lease expires in five minutes; no unleased event writes are permitted.
    }
    processed++;
  }
  return { enabled: true, processed };
}
