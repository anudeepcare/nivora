import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { preferenceStore } from "../lib/preference-store.ts";
import { workspacePreferences } from "../lib/workspace-preferences.ts";
test("sequential preference writes retain acknowledged fields before refresh resolves", async () => {
  const src = fs.readFileSync("components/WorkspacePreferences.tsx", "utf8");
  const ast = ts.createSourceFile(
    "a.tsx",
    src,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const fn = ast.statements.find(
    (x) =>
      ts.isFunctionDeclaration(x) && x.name?.text === "useWorkspacePreferences",
  );
  const code = ts.transpileModule(fn.getText(ast).replace("export ", ""), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const writes = [];
  const hook = new Function(
    "useProduct",
    "useResource",
    "useSyncExternalStore",
    "preferenceStore",
    "api",
    "workspacePreferences",
    code + ";return useWorkspacePreferences;",
  )(
    () => ({ owner: "reader", demo: false, cache: new Map() }),
    () => ({
      data: { documents: [] },
      error: "",
      loading: false,
      refresh() {},
    }),
    (_,get) => get(),
    preferenceStore,
    async (_, v) => {
      writes.push(v.body.preferences);
    },
    workspacePreferences,
  );
  const h = hook();
  await h.save({ chartRange: "3M" });
  await h.save({ watchSort: "review" });
  assert.equal(writes.length, 2);
  assert.equal(writes[1].chartRange, "3M");
  assert.equal(writes[1].watchSort, "review");
});
