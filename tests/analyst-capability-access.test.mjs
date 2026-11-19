import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const ast = ts.createSourceFile(
  "route.ts",
  fs.readFileSync("app/api/analyst/[symbol]/route.ts", "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
const fn = ast.statements.find(
  (n) => ts.isFunctionDeclaration(n) && n.name?.text === "GET",
);
const code = ts.transpileModule(fn.getText(ast).replace("export ", ""), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
function harness({
  allowed = true,
  sampleOnly = false,
  authenticated = true,
} = {}) {
  let statusCalls = 0,
    accessCalls = 0;
  class HttpError extends Error {
    constructor(m, status) {
      super(m);
      this.status = status;
    }
  }
  const bindings = {
    account: async () => {
      if (!authenticated) throw new HttpError("Authentication required", 401);
      return { user: { id: "A", email_confirmed_at: "2026-01-01" } };
    },
    requestAccess: async (_r, id) => {
      assert.equal(id, "A");
      accessCalls++;
      return { allowed, sampleOnly };
    },
    requireFeature: (a, f) => {
      assert.equal(f, "ai");
      if (!a.allowed)
        throw new HttpError("AI not available on this account", 403);
    },
    analystStatus: () => {
      statusCalls++;
      return { available: true, reason: "ready" };
    },
    privateJson: (v) => Response.json(v),
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 500 }),
    HttpError,
  };
  return {
    GET: new Function(...Object.keys(bindings), code + ";return GET;")(
      ...Object.values(bindings),
    ),
    counts: () => ({ statusCalls, accessCalls }),
  };
}
test("capability denies nonAI and sample accounts before advertising deployment readiness", async () => {
  for (const options of [{ allowed: false }, { sampleOnly: true }]) {
    const h = harness(options),
      r = await h.GET(new Request("http://local"));
    assert.equal(r.status, 403);
    assert.equal(h.counts().statusCalls, 0);
    assert.equal((await r.json()).available, undefined);
  }
});
test("entitled capability remains read-only and unauthenticated never checks access", async () => {
  const ready = harness();
  assert.equal(
    (await (await ready.GET(new Request("http://local"))).json()).available,
    true,
  );
  const no = harness({ authenticated: false });
  assert.equal((await no.GET(new Request("http://local"))).status, 401);
  assert.equal(no.counts().accessCalls, 0);
});
