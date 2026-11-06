import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { amount, dateLabel } from "../lib/format.ts";
const source = fs.readFileSync("components/StockFacts.tsx", "utf8");
const ast = ts.createSourceFile(
  "StockFacts.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const declaration = ast.statements.find(
  (n) => ts.isFunctionDeclaration(n) && n.name.text === "stockFactRows",
);
const js = ts.transpileModule(declaration.getText(ast).replace("export ", ""), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const rows = new Function(
  "amount",
  "dateLabel",
  js + "; return stockFactRows;",
)(amount, dateLabel);
const bar = (time, close = 100, volume = 100) => ({
  time,
  open: close,
  high: close,
  low: close,
  close,
  volume,
});
const base = (history = []) => ({
  company: { assetType: "stock", currency: "USD" },
  quote: { currency: "USD", asOf: "2026-11-05T15:00:00Z", previousClose: 100 },
  retrievedAt: "2026-11-05T15:00:00Z",
  history,
});

test("facts exclude forming and intraday bars and only label a matching dated previous close", () => {
  const r = base([
    bar("2026-11-04"),
    bar("2026-11-05", 999),
    bar("2026-11-04T15:00:00Z", 999),
  ]);
  const facts = rows(r);
  assert.equal(
    facts.find((x) => x.label === "Prior close").value,
    amount(100, "USD"),
  );
  assert.equal(
    facts.find((x) => x.label === "Available closing range").value,
    `${amount(100, "USD")} – ${amount(100, "USD")}`,
  );
  r.quote.previousClose = 90;
  assert(rows(r).some((x) => x.label === "Latest history close"));
  assert(!rows(r).some((x) => x.label === "Prior close"));
});
test("relative volume excludes the latest bar from its 20 completed observation denominator", () => {
  const history = Array.from({ length: 21 }, (_, i) =>
    bar(
      new Date(Date.UTC(2026, 9, 15 + i)).toISOString().slice(0, 10),
      100,
      i === 20 ? 150 : 100,
    ),
  );
  const r = base([...history, bar("2026-11-05", 100, 9999)]);
  assert.equal(
    rows(r).find((x) => x.label === "Relative volume · completed").value,
    "1.50×",
  );
  history[3].volume = 0;
  assert(!rows(r).some((x) => x.label === "Relative volume · completed"));
});
test("52-week closing range requires coverage and missing dates do not become market observations", () => {
  const history = Array.from({ length: 366 }, (_, i) =>
    bar(
      new Date(Date.UTC(2025, 10, 4 + i)).toISOString().slice(0, 10),
      100 + i,
    ),
  );
  const r = base(history);
  assert(rows(r).some((x) => x.label === "52-week closing range"));
  r.history = history.slice(-100);
  assert(!rows(r).some((x) => x.label === "52-week closing range"));
  r.evidence = {
    highlights: { MarketCapitalization: 1000000 },
    earnings: [{ date: "2026-11-12", actual: null }],
  };
  assert(
    !rows(r).some(
      (x) =>
        x.label === "Market cap" || x.label === "Next reported earnings date",
    ),
  );
  r.evidence.updatedAt = "2026-11-04";
  assert(
    rows(r)
      .find((x) => x.label === "Market cap")
      .date.startsWith("Dataset updated"),
  );
  assert(rows(r).some((x) => x.label === "Next reported earnings date"));
});
