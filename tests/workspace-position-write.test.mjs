import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync("app/api/workspace/route.ts", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

function workspaceRoute(result) {
  const saved = [];
  const exports = {};
  class HttpError extends Error {
    constructor(message, status = 400) {
      super(message);
      this.status = status;
    }
  }
  const server = {
    HttpError,
    limit: async () => {},
    privateJson: (value) => Response.json(value),
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 500 }),
    account: async () => ({
      user: { id: "synthetic-user" },
      db: {
        from(table) {
          assert.equal(table, "portfolio_positions");
          return {
            insert(row) {
              saved.push(row);
              return {
                select() {
                  return result;
                },
              };
            },
          };
        },
      },
    }),
  };
  new Function("require", "exports", js)((specifier) => {
    if (specifier === "@/lib/server") return server;
    if (specifier === "@/lib/format")
      return { symbolInput: (s) => s.trim().toUpperCase() };
    return {};
  }, exports);
  return {
    saved,
    save: () =>
      exports.POST(
        new Request("http://local/api/workspace", {
          method: "POST",
          body: JSON.stringify({
            op: "position",
            symbol: "app",
            quantity: 2,
            cost: 14,
            currency: "USD",
          }),
        }),
      ),
  };
}

test("legacy duplicate-index rejection is actionable and never returns raw lot information", async () => {
  const { save } = workspaceRoute({
    error: {
      code: "23505",
      message:
        'duplicate key violates unique constraint "portfolio_positions_user_account_symbol_uidx"',
      details: "private synthetic record",
    },
    data: null,
  });
  const response = await save();
  assert.equal(response.status, 409);
  const body = await response.text();
  assert.match(
    body,
    /needs a database update before it can save multiple purchases/,
  );
  assert.doesNotMatch(body, /private synthetic record|uidx/);
});

test("adding the same ticker sends two new lot inserts without changing existing records", async () => {
  const { save, saved } = workspaceRoute({
    error: null,
    data: [{ id: "synthetic-id" }],
  });
  assert.equal((await save()).status, 200);
  assert.equal((await save()).status, 200);
  assert.equal(saved.length, 2);
  assert.ok(saved.every((p) => p.symbol === "APP" && !("id" in p)));
});
