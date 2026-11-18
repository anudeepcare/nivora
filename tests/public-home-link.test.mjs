import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
function harness() {
  let value = "/",
    effect,
    notify,
    resolve,
    unsubscribed = false;
  const pending = new Promise((r) => (resolve = r));
  const m = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    "React",
    ts.transpileModule(
      fs.readFileSync("components/PublicHomeLink.tsx", "utf8"),
      {
        compilerOptions: {
          jsx: ts.JsxEmit.React,
          module: ts.ModuleKind.CommonJS,
        },
      },
    ).outputText,
  )(
    (n) =>
      n === "react"
        ? {
            useState: () => [value, (v) => (value = v)],
            useEffect: (f) => (effect = f),
          }
        : n === "next/link"
          ? { default: "a" }
          : {
              authClient: () => ({
                auth: {
                  onAuthStateChange: (f) => {
                    notify = f;
                    return {
                      data: {
                        subscription: {
                          unsubscribe: () => (unsubscribed = true),
                        },
                      },
                    };
                  },
                  getSession: () => pending,
                },
              }),
            },
    m,
    m.exports,
    React,
  );
  return {
    render: () => m.exports.default({ children: "AURYN" }),
    start: () => effect(),
    notify: (s) => notify("SIGNED_IN", s),
    resolve: (s) => resolve({ data: { session: s } }),
    unsubscribed: () => unsubscribed,
  };
}
test("public home logo routes signed-in to workspace and signed-out public, with stale read fenced", async () => {
  const h = harness();
  assert.equal(h.render().props.href, "/");
  const cleanup = h.start();
  h.notify({ user: { id: "test" } });
  assert.equal(h.render().props.href, "/overview");
  h.resolve(null);
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(h.render().props.href, "/overview");
  h.notify(null);
  assert.equal(h.render().props.href, "/");
  cleanup();
  assert.equal(h.unsubscribed(), true);
});
test("initial existing session changes home destination without loading account records", async () => {
  const h = harness();
  h.render();
  const cleanup = h.start();
  h.resolve({ user: { id: "test" } });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(h.render().props.href, "/overview");
  cleanup();
});
