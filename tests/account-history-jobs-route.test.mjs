import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const id = "00000000-0000-0000-0000-000000000001";
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
function harness({
  auth = true,
  revision = 2,
  digest = "digest",
  commit = true,
  result = null,
  expired = false,
  claimed = true,
} = {}) {
  const calls = [];
  const rows = ["server"];
  const job = {
    id,
    revision: 2,
    state: { now: Date.now(), ledgerDigest: digest, tasks: [{ done: false }] },
    result,
    expires_at: new Date(Date.now() + (expired ? -1000 : 100000)).toISOString(),
    lease_token: "lease",
  };
  const builder = (table) => ({
    select() {
      return this;
    },
    delete() {
      calls.push("delete");
      return this;
    },
    upsert(body) {
      calls.push(body);
      return this;
    },
    eq(k, v) {
      calls.push([k, v]);
      return this;
    },
    lte() {
      return this;
    },
    then(resolve) {
      return Promise.resolve({ data: null }).then(resolve);
    },
    async maybeSingle() {
      return {
        data: table === "auryn_transaction_ledgers" ? { revision, rows } : job,
      };
    },
    async single() {
      return { data: job };
    },
  });
  const admin = {
    from: builder,
    async rpc(name, args) {
      calls.push([name, args]);
      return {
        data:
          name === "auryn_claim_account_history"
            ? claimed
              ? [job]
              : []
            : commit,
      };
    },
  };
  const ast = ts.createSourceFile(
    "route.ts",
    fs.readFileSync("app/api/account-history/jobs/route.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const code = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  const bindings = {
    createClient: () => admin,
    process: {
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "url",
        SUPABASE_SERVICE_ROLE_KEY: "secret",
      },
    },
    HttpError,
    AccountHistoryError: class extends Error {},
    account: async () => {
      if (!auth) throw new HttpError("no", 401);
      return { user: { id: "owner" }, db: { from: builder } };
    },
    limit: async () => {},
    privateJson: Response.json,
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 503 }),
    eodRequest: () => {},
    HISTORY_JOB_VERSION: "test",
    historyLedgerDigest: () => "digest",
    createHistoryJob: (r) => {
      assert.deepEqual(r, rows);
      return job.state;
    },
    advanceHistoryJob: async (r, state) => {
      assert.deepEqual(r, rows);
      calls.push("advance");
      return {
        state,
        result: { status: "available", points: [] },
        retry: false,
      };
    },
  };
  return {
    calls,
    post: new Function(...Object.keys(bindings), code + ";return POST;")(
      ...Object.values(bindings),
    ),
  };
}
const req = (body) =>
  new Request("https://test/api/account-history/jobs", {
    method: "POST",
    body: JSON.stringify(body),
  });
test("job creation uses saved owner ledger snapshot, ignores submitted evidence", async () => {
  const h = harness();
  const r = await h.post(
    req({ revision: 2, confirmComplete: true, rows: ["fake"] }),
  );
  assert.equal(r.status, 200);
  assert.ok(h.calls.some((x) => x?.ledger_snapshot?.[0] === "server"));
  assert.ok(h.calls.some((x) => JSON.stringify(x) === '["user_id","owner"]'));
  assert.ok(!h.calls.includes("advance"));
});
test("steps claim ownership and publish only through lease guarded RPC", async () => {
  const h = harness();
  const r = await h.post(req({ id, revision: 2, confirmComplete: true }));
  assert.equal(r.status, 200);
  const save = h.calls.find((x) => x?.[0] === "auryn_save_account_history");
  assert.equal(save[1].p_user, "owner");
  assert.equal(save[1].p_lease, "lease");
  assert.equal((await r.json()).result.revision, 2);
});
test("auth,revision,snapshot and failed commit never return completed performance", async () => {
  for (const [opts, status] of [
    [{ auth: false }, 401],
    [{ revision: 3 }, 409],
    [{ digest: "changed", result: { status: "available" } }, 409],
    [{ commit: false }, 409],
    [{ expired: true }, 409],
    [{ claimed: false }, 409],
  ]) {
    const h = harness(opts);
    const r = await h.post(req({ id, revision: 2, confirmComplete: true }));
    assert.equal(r.status, status);
    assert.equal((await r.json()).result, undefined);
  }
});
