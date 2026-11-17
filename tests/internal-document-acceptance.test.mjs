import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function load(name, bindings) {
  const ast = ts.createSourceFile(
    "route.ts",
    fs.readFileSync("app/api/documents/route.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
  );
  const js = ts.transpileModule(fn.getText(ast).replace("export ", ""), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  return new Function(...Object.keys(bindings), js + ";return " + name)(
    ...Object.values(bindings),
  );
}
test("internal monitor and financial state are excluded before saved-view limit", async () => {
  let rows = Array.from({ length: 201 }, (_, i) => ({
    key: "internal:" + i,
    kind: "view",
  }));
  rows.push(
    { key: "fin-alert:test", kind: "view" },
    { key: "screen:user", kind: "view" },
  );
  const q = {
    select: () => q,
    eq: () => q,
    order: () => q,
    not: (key, operator, pattern) => {
      assert.equal(key, "key");
      assert.equal(operator, "like");
      rows = rows.filter((r) => !r.key.startsWith(pattern.slice(0, -1)));
      return q;
    },
    limit: async (n) => ({ data: rows.slice(0, n), error: null }),
  };
  const GET = load("GET", {
    account: async () => ({ user: { id: "owner" }, db: { from: () => q } }),
    privateJson: (x) => x,
    failure: (e) => {
      throw e;
    },
  });
  const result = await GET(
    new Request("https://app.test/api/documents?kind=view"),
  );
  assert.deepEqual(
    result.documents.map((r) => r.key),
    ["screen:user"],
  );
});
test("public document writes cannot replace or delete reserved monitor state", async () => {
  class HttpError extends Error {}
  const POST = load("POST", {
    account: async () => ({
      user: { id: "owner" },
      db: {
        from: () => {
          throw Error("Must reject before database write");
        },
      },
    }),
    limit: () => {},
    HttpError,
    cleanDocument: (x) => x,
    privateJson: (x) => x,
    failure: (e) => ({ error: e.message }),
  });
  for (const key of ["internal:alert-monitor-cursor", "fin-alert:test"])
    for (const op of ["delete", "save"]) {
      const result = await POST(
        new Request("https://app.test/api/documents", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: "view", key, op, body: {} }),
        }),
      );
      assert.match(result.error, /reserved/i);
    }
});
