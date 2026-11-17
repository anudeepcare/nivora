import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const installerPath = new URL("../scripts/apply-source.cjs", import.meta.url);
const installer = fs.existsSync(installerPath)
  ? require(installerPath.pathname)
  : null;
function setup(t) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "auryn-install-test-"));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  const root = path.join(parent, "AURYN"),
    source = path.join(parent, "incoming");
  fs.mkdirSync(root);
  fs.mkdirSync(source);
  for (const [name, data] of Object.entries({
    ".git/HEAD": "ref: refs/heads/main\n",
    ".env.local": "KEEP_LOCAL_SECRET",
    ".vercel/project.json": '{"projectId":"keep"}',
    "tests/v6581-info-alignment.test.mjs": "legacy",
    "components/StockClient.tsx": "legacy",
    "middleware.ts": "legacy",
    "package.json": '{"name":"auryn-product"}',
  })) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), data);
  }
  const entries = {
    "package.json": '{"name":"auryn-product"}',
    "app/layout.tsx": "new source",
    "tests/current.test.mjs": "current",
    ".env.example": "SAFE_TEMPLATE",
  };
  let manifest = "";
  for (const [name, data] of Object.entries(entries)) {
    fs.mkdirSync(path.dirname(path.join(source, name)), { recursive: true });
    fs.writeFileSync(path.join(source, name), data);
    manifest +=
      createHash("sha256").update(data).digest("hex") + "  " + name + "\n";
  }
  fs.writeFileSync(path.join(source, "MANIFEST.sha256"), manifest);
  return { root, source };
}
test("source replacement archives legacy files and preserves Git, environment and Vercel identity", (t) => {
  assert.ok(
    installer,
    "An exact source installer is required; unzip overlays retain legacy tests.",
  );
  const { root, source } = setup(t);
  const backup = installer.applySource(root, source);
  assert.equal(
    fs.existsSync(path.join(root, "tests/v6581-info-alignment.test.mjs")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(root, "components/StockClient.tsx")),
    false,
  );
  assert.equal(fs.existsSync(path.join(root, "middleware.ts")), false);
  assert.equal(
    fs.readFileSync(
      path.join(backup, "tests/v6581-info-alignment.test.mjs"),
      "utf8",
    ),
    "legacy",
  );
  assert.equal(
    fs.readFileSync(path.join(root, ".git/HEAD"), "utf8"),
    "ref: refs/heads/main\n",
  );
  assert.equal(
    fs.readFileSync(path.join(root, ".env.local"), "utf8"),
    "KEEP_LOCAL_SECRET",
  );
  assert.equal(
    fs.readFileSync(path.join(root, ".vercel/project.json"), "utf8"),
    '{"projectId":"keep"}',
  );
  assert.equal(
    fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8"),
    "new source",
  );
});
test("a damaged source package is rejected before any existing file moves", (t) => {
  assert.ok(installer);
  const { root, source } = setup(t);
  fs.writeFileSync(path.join(source, "app/layout.tsx"), "damaged");
  assert.throws(() => installer.applySource(root, source), /checksum/i);
  assert.equal(
    fs.readFileSync(path.join(root, "components/StockClient.tsx"), "utf8"),
    "legacy",
  );
});
test("unlisted files in a source package cannot enter the application", (t) => {
  assert.ok(installer);
  const { root, source } = setup(t);
  fs.writeFileSync(path.join(source, "unlisted.ts"), "extra");
  assert.throws(() => installer.applySource(root, source), /unlisted/i);
  assert.equal(
    fs.existsSync(path.join(root, "tests/v6581-info-alignment.test.mjs")),
    true,
  );
});
