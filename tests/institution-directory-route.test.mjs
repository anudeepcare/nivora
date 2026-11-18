import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {
  institutionQuery,
  projectInstitutionPage,
} from "../lib/institution-directory.ts";
function load(file, name, bindings) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const fn = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
  );
  const js = ts.transpileModule(fn.getText(ast).replace(/^export /, ""), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  return providerFixtureFunction(...Object.keys(bindings), js + `;return ${name}`)(
    ...Object.values(bindings),
  );
}
class HttpError extends Error {
  constructor(m, status) {
    super(m);
    this.status = status;
  }
}
test("finder route requires authenticated advanced access and rejects sample-only before provider reads", async () => {
  let reads = 0;
  const b = {
    account: async () => ({ user: { id: "self" } }),
    requestAccess: async () => ({ sampleOnly: false }),
    requireFeature: (_, f) => assert.equal(f, "advanced"),
    limit: async () => {},
    reserveAccess: async () => {},
    institutionQuery,
    readInstitutionPage: async (q) => {
      reads++;
      return q;
    },
    privateJson: (x) => x,
    failure: (e) => ({ status: e.status, message: e.message }),
    HttpError,
  };
  const route = () => load("app/api/institution-directory/route.ts", "GET", b);
  assert.equal(
    (await route()(new Request("https://local/api?cik=1&offset=0"))).cik,
    "1",
  );
  assert.equal(reads, 1);
  b.requestAccess = async () => ({ sampleOnly: true });
  assert.equal((await route()(new Request("https://local/api"))).status, 403);
  assert.equal(reads, 1);
  b.account = async () => {
    throw new HttpError("Sign in", 401);
  };
  assert.equal((await route()(new Request("https://local/api"))).status, 401);
  assert.equal(reads, 1);
});
test("unsupported query and injected destinations never reach provider or consume research quota", async () => {
  let calls = 0;
  const GET = load("app/api/institution-directory/route.ts", "GET", {
    account: async () => ({ user: { id: "self" } }),
    requestAccess: async () => ({ sampleOnly: false }),
    requireFeature: () => {},
    institutionQuery,
    HttpError,
    failure: (e) => ({ status: e.status }),
    limit: async () => {
      calls++;
    },
    reserveAccess: async () => {
      calls++;
    },
    readInstitutionPage: async () => {
      calls++;
    },
    privateJson: (x) => x,
  });
  for (const p of [
    "url=https://evil",
    "cik=1&cik=2",
    "cik=1&offset=50",
    "offset=999999",
  ])
    assert.equal(
      (await GET(new Request(`https://local/api?${p}`))).status,
      400,
    );
  assert.equal(calls, 0);
});
test("transport uses fixed institutional host, bounded body, timeout, no redirects and exact paging", async () => {
  let request;
  const raw = {
    isPreview: false,
    data: {
      quarter: "2026Q2",
      totalCount: 0,
      offset: 0,
      limit: 50,
      institutions: [],
    },
  };
  const read = load(
    "lib/institution-directory.server.ts",
    "readInstitutionPage",
    {
      HttpError,
      limit: async () => {},
      process: { env: { SENTISENSE_API_KEY: "fixture" } },
      fetch: async (url, init) => {
        request = { url, init };
        return { ok: true };
      },
      AbortSignal,
      readBoundedMarketJson: async (_, cap) => {
        assert.equal(cap, 2000000);
        return raw;
      },
      projectInstitutionPage,
    },
  );
  await read(institutionQuery(new URLSearchParams("q=Example%20Fund")));
  const u = new URL(request.url);
  assert.equal(u.origin, "https://app.sentisense.ai");
  assert.equal(u.pathname, "/api/v1/institutional/institutions");
  assert.equal(u.searchParams.get("q"), "Example Fund");
  assert.equal(u.searchParams.get("limit"), "50");
  assert.equal(request.init.redirect, "error");
  assert.ok(request.init.signal);
  assert.equal(request.init.next.revalidate, 300);
});
