import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function load() {
  const ast = ts.createSourceFile(
    "options-source.ts",
    fs.readFileSync("lib/options-source.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const body = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace(/^export /, ""))
    .join("\n");
  const code = ts.transpileModule(body, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  let calls = 0;
  class HttpError extends Error {
    constructor(message, status = 400) {
      super(message);
      this.status = status;
    }
  }
  const b = {
    HttpError,
    alpacaOptions: async () => {
      calls++;
      throw Error("Forbidden");
    },
    eodRequest: async () => {
      calls++;
      throw Error("Forbidden");
    },
    normalizeOptions: (x) => x,
  };
  return {
    read: new Function(...Object.keys(b), code + ";return loadOptionChain;")(
      ...Object.values(b),
    ),
    calls: () => calls,
  };
}
test("legacy enable/provider flags never authorize Alpaca or Marketplace option-chain calls", async () => {
  const old = {
    enabled: process.env.AURYN_OPTIONS_ENABLED,
    provider: process.env.AURYN_OPTIONS_PROVIDER,
  };
  try {
    process.env.AURYN_OPTIONS_ENABLED = "true";
    for (const provider of ["alpaca", "eodhd", "unicornbay", ""]) {
      process.env.AURYN_OPTIONS_PROVIDER = provider;
      const h = load();
      const result = await h.read("AAPL", null);
      assert.equal(result.status, "unavailable");
      assert.deepEqual(result.contracts, []);
      assert.equal(result.complete, false);
      assert.match(result.message, /Company positioning/);
      assert.equal(h.calls(), 0);
    }
  } finally {
    for (const [key, value] of [
      ["AURYN_OPTIONS_ENABLED", old.enabled],
      ["AURYN_OPTIONS_PROVIDER", old.provider],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
