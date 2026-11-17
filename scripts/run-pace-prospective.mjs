import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { verifyProspectivePublication } from "../lib/pace-publication.ts";

// Read-only research report: never publishes user-supplied returns to the public feed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [inputPath, mappingPath, outputPath] = process.argv.slice(2);
if (!inputPath || !mappingPath || !outputPath)
  throw Error(
    "Usage: node --experimental-strip-types scripts/run-pace-prospective.mjs INPUT.json SECURITY-SYMBOL-MAP.json OUTPUT.json",
  );
if (fs.existsSync(outputPath))
  throw Error("Output already exists; choose a new report path.");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || !/^https:\/\//.test(url))
  throw Error("Configure the publication database URL and public key.");
const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const mappingBytes = fs.readFileSync(mappingPath);
const symbols = JSON.parse(mappingBytes.toString("utf8"));
const report = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      path.join(root, "scripts/run-pace-study.mjs"),
      path.resolve(inputPath),
    ],
    { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  ),
);
if (report.coverage.excluded || !report.coverage.included)
  throw Error(
    "Resolve replay/data exclusions before producing a prospective comparison.",
  );
const db = createClient(url, key, { auth: { persistSession: false } });
const receipts = [];
const observedAt = new Date().toISOString();
for (const asset of input.assets) {
  const symbol = symbols[asset.id];
  if (typeof symbol !== "string" || !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
    throw Error(`Missing listing identity for ${asset.id}`);
  // Filter to exact policy and security; paginate the full record, not the UI latest-100 feed.
  const records = [];
  for (let offset = 0; ; offset += 500) {
    const result = await db
      .from("auryn_public_pace_records")
      .select(
        "id,published_at,symbol,signal_period,policy,pace,reference_price,quote_at,evidence_hash,policy_hash",
      )
      .eq("symbol", symbol)
      .eq("policy", input.policyVersion)
      .eq("policy_hash", input.policyHash)
      .order("id")
      .range(offset, offset + 499);
    if (result.error) throw Error("Publication records could not be verified.");
    records.push(...result.data);
    if (result.data.length < 500) break;
  }
  for (const row of asset.rows) {
    if (Date.parse(row.periodEnd) > Date.parse(observedAt))
      throw Error("Future outcomes cannot be reported as observed.");
    receipts.push({
      securityId: asset.id,
      month: row.month,
      ...verifyProspectivePublication(
        symbol,
        { ...row, policyVersion: input.policyVersion },
        records,
      ),
    });
  }
}
const output = {
  ...report,
  prospective: {
    receipts,
    verifiedAt: observedAt,
    sourceOrigin: new URL(url).origin,
    mappingSha256: createHash("sha256").update(mappingBytes).digest("hex"),
    scope:
      "Same-stock server publication timing verified. Return inputs and security identity mapping still require independent audit. Database receipts are not independent timestamp certification.",
  },
};
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n", {
  flag: "wx",
});
