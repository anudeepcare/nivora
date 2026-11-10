import fs from "node:fs";
import { researchAccumulation } from "/home/claude/auryn_src/AURYN/lib/accumulation-policy-v6.ts";
const dir = "/home/claude/market", [shard, shards] = process.argv.slice(2).map(Number);
const files = fs.readdirSync(`${dir}/raw`).filter((f) => f.endsWith(".json")).sort().filter((_, i) => i % shards === shard);
const rows = [];
for (const f of files) {
  let fund; try { fund = JSON.parse(fs.readFileSync(`${dir}/fund/${f}`, "utf8")); } catch { continue; }
  const years = Object.keys(fund).sort(); if (years.length < 2) continue;
  const { bars: raw } = JSON.parse(fs.readFileSync(`${dir}/raw/${f}`, "utf8"));
  const bars = raw.filter((b) => b.slice(1, 5).every((x) => typeof x === "number" && x > 0)).map(([time, open, high, low, close, volume]) => ({ time, open, high: Math.max(open, high, low, close), low: Math.min(open, high, low, close), close, volume }));
  if (bars.length < 300) continue;
  const c = bars.map((b) => b.close), idx = new Map(bars.map((b, i) => [b.time, i]));
  const sma = (i, n) => { let s = 0; for (let k = i - n + 1; k <= i; k++) s += c[k]; return s / n; };
  for (const s of researchAccumulation(bars, `${bars.at(-1).time}T23:00:00Z`, "us-equity").history ?? []) {
    const i = idx.get(s.date); if (i == null || i < 252 || i + 126 >= bars.length) continue;
    const cut = new Date(Date.parse(s.date) - 90 * 864e5).toISOString().slice(0, 10);
    const k = years.filter((y) => y <= cut).at(-1); if (!k) continue;
    const cur = fund[k], prev = fund[years[years.indexOf(k) - 1]];
    if (cur.TotalRevenue == null || cur.OperatingIncome == null || cur.FreeCashFlow == null) continue;
    const growth = prev?.TotalRevenue > 0 ? (cur.TotalRevenue / prev.TotalRevenue - 1) * 100 : null;
    const dil = prev?.DilutedAverageShares > 0 && cur.DilutedAverageShares > 0 ? (cur.DilutedAverageShares / prev.DilutedAverageShares - 1) * 100 : null;
    const profitable = cur.OperatingIncome > 0 && cur.FreeCashFlow > 0;
    const q = profitable && (dil == null || dil <= 10) && (growth == null || growth > -5) ? 2 : cur.OperatingIncome < 0 && cur.FreeCashFlow < 0 ? 0 : 1;
    let hi = 0; for (let j = i - 251; j <= i; j++) hi = Math.max(hi, c[j]);
    let lo63 = Infinity; for (let j = i - 62; j <= i; j++) lo63 = Math.min(lo63, c[j]);
    const m = cur.TotalRevenue > 0 ? (cur.OperatingIncome / cur.TotalRevenue) * 100 : null;
    rows.push([q, s.multiplier, i + 252 < bars.length ? +(c[i + 252] / c[i] - 1).toFixed(4) : null, +(c[i + 126] / c[i] - 1).toFixed(4), s.date.slice(0, 7), +((1 - c[i] / hi) * 100).toFixed(1), c[i] > sma(i, 50) ? 1 : 0, c[i] > sma(i, 200) ? 1 : 0, +((c[i] / c[i - 63] - 1) * 100).toFixed(1), +((c[i - 21] / c[i - 252] - 1) * 100).toFixed(1), +((c[i] / lo63 - 1) * 100).toFixed(1), growth == null ? null : +growth.toFixed(1), m == null ? null : +m.toFixed(1), sma(i, 50) > sma(i, 200) ? 1 : 0]);
  }
}
fs.writeFileSync(`${dir}/out/c${shard}.json`, JSON.stringify(rows));
