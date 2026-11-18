import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function load() {
  const file = "lib/sentisense-provider.server.ts",
    ast = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
  const f = ast.statements.find(
    (n) =>
      ts.isFunctionDeclaration(n) && n.name?.text === "createProviderBackend",
  );
  const js = ts.transpileModule(f.getText(ast).replace(/^export /, ""), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(js + ";return createProviderBackend")();
}
const scope = { account: "a".repeat(64), credential: "c".repeat(64) },
  compat = { mode: "compatibility", max: 20, scope: "default" },
  required = { ...compat, mode: "required" };
test("compatibility aggregates all keys via existing shared limiter and preserves local cooldown", async () => {
  const keys = [];
  let now = 0;
  const b = load()({
    limit: async (k, max) => {
      keys.push([k, max]);
    },
    rpc: async () => {
      throw Error("not needed");
    },
    now: () => now,
  });
  await b.reserve(scope, compat);
  assert.equal(keys.length, 2);
  assert.match(keys[0][0], /account/);
  await b.cooldown(scope, 60, compat);
  assert.equal(
    (await b.reserve({ ...scope, credential: "d".repeat(64) }, compat)).allowed,
    false,
  );
  now = 60001;
  assert.equal((await b.reserve(scope, compat)).allowed, true);
});
test("required mode uses atomic RPC and never falls back on storage failure", async () => {
  let legacy = 0;
  const calls = [];
  const b = load()({
    limit: async () => {
      legacy++;
    },
    rpc: async (name, p) => {
      calls.push([name, p]);
      return { data: { allowed: true, retryAfterSeconds: 0 }, error: null };
    },
  });
  assert.equal((await b.reserve(scope, required)).allowed, true);
  assert.equal(calls[0][0], "auryn_sentisense_reserve");
  assert.equal(legacy, 0);
  assert.equal(calls[0][1].p_account, scope.account);
  const fail = load()({
    limit: async () => {
      legacy++;
    },
    rpc: async () => ({ data: null, error: { message: "private" } }),
  });
  await assert.rejects(() => fail.reserve(scope, required));
  assert.equal(legacy, 0);
});
test("required cooldown RPC acknowledgement and malformed reserve responses fail closed", async () => {
  const bad = load()({
    limit: async () => {},
    rpc: async () => ({ data: { allowed: "yes" }, error: null }),
  });
  await assert.rejects(() => bad.reserve(scope, required));
  await assert.rejects(() => bad.cooldown(scope, 60, required));
});
