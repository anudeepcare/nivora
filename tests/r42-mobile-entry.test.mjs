import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postcss from "postcss";
import ts from "typescript";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function mobileDeclarations(file, selector) {
  const matching = [];
  postcss.parse(read(file)).walkRules(selector, (rule) => {
    if (
      rule.parent.type === "atrule" &&
      rule.parent.params.includes("max-width: 760px")
    ) {
      matching.push(...rule.nodes.filter(({ type }) => type === "decl"));
    }
  });
  return Object.fromEntries(matching.map(({ prop, value }) => [prop, value]));
}

test("the public phone opening shares the document chrome at the inset and places the nav below it", () => {
  const file = "components/PublicPlaidOpening.module.css";
  const opening = mobileDeclarations(file, ".opening.opening");
  assert.match(
    opening.background ?? "",
    /linear-gradient\(\s*180deg,\s*var\(--chrome-surface\)\s+env\(safe-area-inset-top/,
  );
  assert.match(opening.padding ?? "", /^max\(12px, env\(safe-area-inset-top/);
  assert.match(opening.padding ?? "", /safe-area-inset-left/);
});

test("the phone sign-in owns a single top inset and its aligned header keeps both 44px controls", () => {
  const file = "components/SessionAccess.css";
  const access = '#auryn-app .mp-auth[data-plaid-page="access"]';
  const screen = mobileDeclarations(file, access);
  assert.match(
    screen.background ?? "",
    /linear-gradient\(\s*180deg,\s*var\(--chrome-surface\)\s+env\(safe-area-inset-top/,
  );
  assert.match(
    screen["padding-block-start"] ?? "",
    /^max\(6px, env\(safe-area-inset-top/,
  );
  const header = mobileDeclarations(file, `${access} > header`);
  assert.equal(header["min-height"], "44px");
  assert.equal(header.padding, "0");
});

test("X displays its recognizable logo once and retains the actual named provider action", () => {
  const path = "components/Session.tsx";
  const ast = ts.createSourceFile(
    path,
    read(path),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const buttons = [];
  function visit(node) {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(ast) === "button" &&
      node.openingElement.getText(ast).includes('aria-label="Continue with X"')
    )
      buttons.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(buttons.length, 1);
  const [button] = buttons;
  assert.match(button.openingElement.getText(ast), /social\("x"\)/);
  assert.match(
    button.openingElement.getText(ast),
    /socialProviders\.x === false/,
  );
  const content = button.children.filter(
    (node) => !ts.isJsxText(node) || node.getText(ast).trim(),
  );
  assert.equal(content.length, 1);
  assert.match(content[0].getText(ast), /^<svg[\s\S]*aria-hidden="true"/);
});

test("phone startup paints through the native safe area without moving or hiding recovery actions", () => {
  const file = "components/LaunchScreen.module.css";
  const start = mobileDeclarations(file, ".launch");
  assert.match(
    start.background ?? "",
    /linear-gradient\(\s*180deg,\s*var\(--chrome-surface\)\s+env\(safe-area-inset-top/,
  );
  const css = read(file);
  const compact = mobileDeclarations(file, ".content");
  assert.equal(compact["margin-block"], "16px");
  assert.match(css, /\.launch\s*\{[^}]*overflow:\s*auto/);
  assert.match(css, /\.actions button\s*\{[^}]*min-height:\s*44px/);
});

test("the sign-in theme control follows daylight changes at the root and disconnects on exit", () => {
  const path = "components/Session.tsx";
  const ast = ts.createSourceFile(
    path,
    read(path),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const login = ast.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === "Login",
  );
  assert.ok(login?.body);
  const sync = login.body.statements.find((node) =>
    /^useEffect\([\s\S]*setLoginTheme\(/.test(node.getText(ast)),
  );
  assert.ok(sync, "the real Login component runs the effect");
  const root = { dataset: { theme: "dark" } };
  const themes = [];
  let notify;
  let disconnected = false;
  let cleanup;
  class Observer {
    constructor(callback) {
      notify = callback;
    }
    observe(target, options) {
      assert.equal(target, root);
      assert.deepEqual(options, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }
    disconnect() {
      disconnected = true;
    }
  }
  const code = ts.transpileModule(sync.getText(ast), {
    compilerOptions: { target: ts.ScriptTarget.ESNext },
  }).outputText;
  new Function(
    "useEffect",
    "setLoginTheme",
    "document",
    "MutationObserver",
    code,
  )(
    (effect) => (cleanup = effect()),
    (theme) => themes.push(theme),
    { documentElement: root },
    Observer,
  );
  assert.deepEqual(themes, ["dark"]);
  root.dataset.theme = "light";
  assert.equal(typeof notify, "function");
  notify();
  assert.deepEqual(themes, ["dark", "light"]);
  cleanup();
  assert.equal(disconnected, true);
});
