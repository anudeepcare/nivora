import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (file) => fs.readFileSync(`components/${file}.tsx`, "utf8");
test("research range and consensus keep distinctions with accessible contextual help", () => {
  const s = read("IntegratedResearch");
  assert.match(s, /<Help label="Closing price range">/);
  assert.match(s, /<Help label="Analyst target">/);
  assert.doesNotMatch(s, /<p>Analyst consensus, not guaranteed\.<\/p>/);
  assert.match(s, /Analyst opinion, not a forecast or guarantee/);
  assert.match(s, /closingRange\?\.date/);
});
test("freshness copy never prints paid target provider or generic raw source", () => {
  const s = read("ResearchBrief");
  assert.doesNotMatch(s, /`SentiSense targets/);
  assert.doesNotMatch(s, /r\.evidence\?\.source \?\?/);
  assert.match(s, /<Help label="Data dates">/);
});
test("stock facts and evidence dates remain available without repeated inline date paragraphs", () => {
  assert.doesNotMatch(read("StockFacts"), /<small>\{row\.date\}<\/small>/);
  assert.match(read("StockFacts"), /<p>\{row\.date\}<\/p>/);
  assert.match(read("ResearchEvidenceGrid"), /<Help label="Evidence dates">/);
});

test("scenario panel preserves model versus analyst distinction and out-of-range warnings", () => {
  const s = read("StockPillars");
  assert.match(s, /Analyst targets.*AURYN model · conditional/);
  assert.match(s, /customerText\(view\.cases\.source\)/);
  assert.match(s, /Price above highest target/);
  assert.match(s, /Price below bear case/);
  assert.match(
    s,
    /Individual target revision dates and forecast horizon are\s+not/,
  );
});
