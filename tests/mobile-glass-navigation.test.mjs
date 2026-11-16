import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

test("offline brand asset remains available when the network is unavailable", async () => {
  const handlers = {};
  vm.runInNewContext(fs.readFileSync("public/sw.js", "utf8"), {
    self: {
      addEventListener: (name, fn) => (handlers[name] = fn),
      location: { origin: "https://auryn.example" },
    },
    URL,
    Response,
    fetch: async () => {
      throw Error("offline");
    },
    caches: {
      match: async () => new Response("<svg/>"),
      open: async () => ({ match: async () => new Response("<svg/>") }),
    },
  });
  let result;
  handlers.fetch({
    request: {
      url: "https://auryn.example/icon.svg",
      method: "GET",
      mode: "no-cors",
    },
    respondWith: (p) => (result = p),
  });
  assert.ok(result, "offline icon is served by the worker");
  assert.equal(await (await result).text(), "<svg/>");
});

test("activation removes only obsolete AURYN offline caches", async () => {
  const handlers = {},
    deleted = [];
  vm.runInNewContext(fs.readFileSync("public/sw.js", "utf8"), {
    self: {
      addEventListener: (name, fn) => (handlers[name] = fn),
      clients: { claim: async () => {} },
    },
    caches: {
      keys: async () => ["auryn-offline-v1", "unrelated-cache"],
      delete: async (key) => deleted.push(key),
    },
  });
  let result;
  handlers.activate({ waitUntil: (p) => (result = p) });
  await result;
  assert.deepEqual(deleted, ["auryn-offline-v1"]);
});

test("navigation shares glass tokens and preserves explicit safe-area top padding", () => {
  const css = fs.readFileSync("components/WorkspaceShell.module.css", "utf8");
  assert.match(css, /var\(--workspace-glass\)/);
  assert.match(css, /var\(--blue-soft\)/);
  assert.match(css, /padding-top:.*safe-area-inset-top/);
  assert.doesNotMatch(css, /padding-block:\s*7px/);
});

test("workspace menu uses a recognizable menu icon rather than an ambiguous initial", () => {
  const source = fs.readFileSync("components/Shell.tsx", "utf8");
  assert.match(source, /<Menu size=\{20\}/);
  assert.match(source, /aria-controls="workspace-tools"/);
  assert.match(source, /id="workspace-tools"/);
});
