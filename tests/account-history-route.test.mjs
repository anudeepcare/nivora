import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
function harness({ auth = true, revision = 2 } = {}) {
  const calls = [];
  const ast = ts.createSourceFile(
    "route.ts",
    fs.readFileSync("app/api/account-history/route.ts", "utf8"),
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
  const db = {
    from(table) {
      calls.push(table);
      return this;
    },
    select() {
      return this;
    },
    eq(key, value) {
      calls.push([key, value]);
      return this;
    },
    async maybeSingle() {
      return { data: { revision, rows: ["server-only"] } };
    },
  };
  const bindings = {
    HttpError,
    AccountHistoryError: class extends Error {},
    account: async () => {
      if (!auth) throw new HttpError("Sign in", 401);
      return { user: { id: "owner" }, db };
    },
    limit: async () => {},
    privateJson: Response.json,
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 503 }),
    eodRequest: () => {},
    accountHistory: async (rows) => {
      calls.push(rows);
      return { status: "available", points: [] };
    },
  };
  return {
    calls,
    post: new Function(...Object.keys(bindings), code + "; return POST;")(
      ...Object.values(bindings),
    ),
  };
}
const request = (body) =>
  new Request("https://app.test/api/account-history", {
    method: "POST",
    body: JSON.stringify(body),
  });
test("authenticates, scopes ledger owner and ignores submitted rows", async () => {
  const h = harness();
  const r = await h.post(
    request({ revision: 2, confirmComplete: true, rows: ["attacker"] }),
  );
  assert.equal(r.status, 200);
  assert.ok(h.calls.some((c) => JSON.stringify(c) === '["user_id","owner"]'));
  assert.ok(h.calls.some((c) => JSON.stringify(c) === '["server-only"]'));
});
test("rejects unauthenticated, unconfirmed and stale revision before price work", async () => {
  for (const [opts, body, status] of [
    [{ auth: false }, { revision: 2, confirmComplete: true }, 401],
    [{}, { revision: 2, confirmComplete: false }, 400],
    [{}, { revision: 1, confirmComplete: true }, 409],
  ]) {
    const h = harness(opts);
    assert.equal((await h.post(request(body))).status, status);
    assert.ok(!h.calls.some((c) => JSON.stringify(c) === '["server-only"]'));
  }
});
