import test from "node:test";
import assert from "node:assert/strict";
import { reportContent } from "../lib/report-content.ts";
test("provider metric directive preserves exact label value and change as data", () => {
  assert.deepEqual(
    reportContent(
      'Revenue rose [1].\n\n::metric{label="Q3 2026 Revenue" value="$2.18B" change="+55% YoY above $2.055B–$2.085B guide"}',
    ),
    [
      { kind: "paragraph", text: "Revenue rose [1]." },
      {
        kind: "metric",
        label: "Q3 2026 Revenue",
        value: "$2.18B",
        change: "+55% YoY above $2.055B–$2.085B guide",
      },
    ],
  );
});
test("escaped quotes and markup remain text, unknown syntax retains meaningful values", () => {
  const result = reportContent(
    '::metric{label="<script>" value="$4" change="Says \\"hold\\""}\n::widget{label="Reported date" value="2026-11-04"}',
  );
  assert.equal(result[0].label, "<script>");
  assert.equal(result[0].change, 'Says "hold"');
  assert.equal(result[1].text, "Reported date · 2026-11-04");
  assert.equal(JSON.stringify(result).includes("::widget"), false);
});
test("ordinary prose numbers citations and incomplete metrics are preserved without fabrication", () => {
  assert.deepEqual(
    reportContent('EPS $4.30 [2]\n\n::metric{label="Revenue" value="$2.18B"}'),
    [
      { kind: "paragraph", text: "EPS $4.30 [2]" },
      { kind: "metric", label: "Revenue", value: "$2.18B", change: "" },
    ],
  );
});
test("duplicate metric keys preserve every value as readable text instead of selecting one", () => {
  assert.deepEqual(
    reportContent(
      '::metric{label="Revenue" value="$2.18B" value="$3B" change="+55%"}',
    ),
    [{ kind: "paragraph", text: "Revenue · $2.18B · $3B · +55%" }],
  );
  assert.deepEqual(
    reportContent('::metric{label="Revenue" label="EPS" value="$4.30"}'),
    [{ kind: "paragraph", text: "Revenue · EPS · $4.30" }],
  );
});
