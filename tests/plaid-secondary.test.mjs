import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("access screens share the publication theme without replacing account controls", () => {
  const auth = read("components/Session.tsx");
  const recovery = read("components/PasswordRecovery.tsx");
  assert.match(auth, /data-plaid-page="access"/);
  assert.match(recovery, /data-plaid-page="access"/);
  assert.match(auth, /signInWithPassword/);
  assert.match(auth, /resetPasswordForEmail/);
  assert.match(auth, /Continue with Google/);
  assert.match(auth, /Remember me on this browser/);
});

test("secondary pages explicitly opt into the new readable composition", () => {
  for (const [file, page] of [
    ["LegalDocument", "documents"],
    ["Plans", "plans"],
    ["Contact", "contact"],
    ["SupportingViews", "settings"],
    ["OwnerAccess", "owner"],
    ["MonthlyPlan", "monthly"],
    ["ReleaseNotes", "updates"],
    ["AlertCenter", "alerts"],
    ["ResearchLab", "lab"],
    ["Trading", "trading"],
  ])
    assert.match(
      read(`components/${file}.tsx`),
      new RegExp(`data-plaid-page="${page}"`),
    );
});

test("secondary theme has desktop and phone rules, visible focus, and day and night surfaces", () => {
  const css = read("app/core/plaid-secondary.css");
  assert.match(css, /data-theme="dark"/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /linear-gradient/);
  assert.match(css, /--plaid-ink/);
  assert.match(read("app/layout.tsx"), /plaid-secondary\.css/);
});
