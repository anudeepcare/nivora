import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = (path) => readFileSync(path, "utf8");

test("standalone account recovery remains task-focused without importing a product walkthrough", () => {
  const recovery = source("components/PasswordRecovery.tsx");
  assert.doesNotMatch(recovery, /PublicSample|PublicLanding/);
  assert.match(recovery, /action|onSubmit=\{submit\}/);
  assert.match(recovery, /href="\/login\?mode=reset"/);
  assert.match(recovery, /href="\/help"/);
});

test("Pace offers the detailed workflow, rather than linking back to the current Pace page", () => {
  const education = source("components/PublicEducation.tsx");
  assert.match(education, /href=\{pace \? "\/about" : "\/pace"\}/);
});
