import test from "node:test";
import assert from "node:assert/strict";
import {
  allowedPreview,
  selectHistory,
  stageLabel,
  filteredCompanies,
} from "../lib/presentation/preview.ts";
test("preview refuses public hosts and disabled flag", () => {
  assert.equal(allowedPreview("auryninvest.com", "true"), false);
  assert.equal(allowedPreview("localhost:3000", "false"), false);
  assert.equal(allowedPreview("terminal.local:4173", "true"), true);
  assert.equal(allowedPreview("localhost.attacker.com", "true"), false);
});
test("missing stage is not pause and watch is not accumulation", () => {
  assert.equal(stageLabel(null), "Not established");
  assert.equal(stageLabel(1), "Watch");
  assert.equal(stageLabel(0), "Pause");
});
test("chart ranges select different dated samples without altering source", () => {
  const data = Array.from({ length: 252 }, (_, i) => ({
    date: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10),
    value: i,
  }));
  assert.equal(selectHistory(data, "1M").length, 21);
  assert.equal(selectHistory(data, "1Y").length, 252);
  assert.equal(data.length, 252);
  assert.equal(selectHistory(data, "1M").at(-1).value, 251);
});
test("search matches symbols and names and does not invent results", () => {
  const rows = [
    { symbol: "NOVA", name: "Nova Systems" },
    { symbol: "ARC", name: "Arc Energy" },
  ];
  assert.deepEqual(filteredCompanies(rows, "energy"), [rows[1]]);
  assert.deepEqual(filteredCompanies(rows, "unknown"), []);
});
