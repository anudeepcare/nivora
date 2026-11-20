import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (file) => fs.readFileSync(`components/${file}`, "utf8");
test("public introduction uses content-sized spacing rather than a forced screen", () => {
  const css = read("PublicLanding.module.css");
  assert.doesNotMatch(css, /min-height: (620|570)px/);
});
test("mobile account access is directly below the single entry toolbar without marketing", () => {
  const source = read("Session.tsx");
  assert.match(
    source,
    /<\/header>\s*<section className=\{experience.main\} aria-label="Account access">/,
  );
  assert.doesNotMatch(source, /storyContent|researchCard/);
});
test("settings links to its notification section instead of duplicating the alert shortcut", () => {
  const source = read("SupportingViews.tsx").split(
    "export function Compare",
  )[0];
  assert.match(source, /href="#settings-notifications"/);
  assert.equal((source.match(/<span>Price alerts<\/span>/g) || []).length, 0);
});
test("research panel explanations have one visible accessible owner", () => {
  const source = read("SettingsExperience.tsx");
  assert.doesNotMatch(source, /title=\{detail\}/);
  assert.match(source, /<small>\{detail\}<\/small>/);
});
test("public conversion has one closing section rather than consecutive pricing pitches", () => {
  const source = read("PublicLanding.tsx");
  assert.doesNotMatch(source, /reference-pricing-title/);
  assert.match(source, /id="pricing"/);
  assert.match(source, /Compare plans/);
});
test("settings spacing selection uses an explicit readable foreground", () => {
  assert.match(
    read("SettingsPage.module.css"),
    /density-options.*aria-pressed="true"[\s\S]*?color: #fff/,
  );
});
test("security keeps password changes behind an explicit disclosure", () => {
  const source = read("SupportingViews.tsx").split(
    "export function Compare",
  )[0];
  assert.match(source, /<details className="settings-password-change">/);
  assert.match(source, /<summary>Change password<\/summary>/);
  assert.match(source, /autoComplete="new-password"/);
  assert.match(source, /onSubmit=\{update\}/);
});
