(function (root) {
  "use strict";
  const E = {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sgn = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
  const sum = (a, i, n) => { let s = 0; for (let k = i - n + 1; k <= i; k++) s += a[k]; return s; };
  const med = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  E.clamp = clamp;
  E.sma = (a, n) => a.map((_, i) => (i < n - 1 ? null : sum(a, i, n) / n));
  E.ema = (a, n) => { const o = a.map(() => null); if (a.length < n) return o; let e = sum(a, n - 1, n) / n; o[n - 1] = e; const k = 2 / (n + 1); for (let i = n; i < a.length; i++) { e = a[i] * k + e * (1 - k); o[i] = e; } return o; };
  E.rsi = (c, n = 14) => {
    const o = c.map(() => null); if (c.length <= n) return o;
    let g = 0, l = 0; for (let i = 1; i <= n; i++) { const d = c[i] - c[i - 1]; if (d >= 0) g += d; else l -= d; }
    g /= n; l /= n; const f = () => (l === 0 ? (g === 0 ? 50 : 100) : 100 - 100 / (1 + g / l)); o[n] = f();
    for (let i = n + 1; i < c.length; i++) { const d = c[i] - c[i - 1]; g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; o[i] = f(); }
    return o;
  };
  E.tr = (h, l, c) => h.map((x, i) => (i === 0 ? x - l[i] : Math.max(x - l[i], Math.abs(x - c[i - 1]), Math.abs(l[i] - c[i - 1]))));
  E.atr = (h, l, c, n = 14) => { const tr = E.tr(h, l, c), o = h.map(() => null); if (h.length <= n) return o; let a = 0; for (let i = 1; i <= n; i++) a += tr[i]; a /= n; o[n] = a; for (let i = n + 1; i < h.length; i++) { a = (a * (n - 1) + tr[i]) / n; o[i] = a; } return o; };
  E.macd = (c) => {
    const e12 = E.ema(c, 12), e26 = E.ema(c, 26), line = c.map((_, i) => (e12[i] == null || e26[i] == null ? null : e12[i] - e26[i]));
    const idx = line.findIndex((x) => x != null), sig = line.map(() => null);
    if (idx >= 0) E.ema(line.slice(idx), 9).forEach((v, j) => { sig[idx + j] = v; });
    return { line, signal: sig, hist: line.map((v, i) => (v == null || sig[i] == null ? null : v - sig[i])) };
  };
  E.boll = (c, n = 20, k = 2) => {
    const mid = E.sma(c, n), upper = [], lower = [], pctB = [];
    for (let i = 0; i < c.length; i++) {
      if (mid[i] == null) { upper.push(null); lower.push(null); pctB.push(null); continue; }
      let s = 0; for (let j = i - n + 1; j <= i; j++) s += (c[j] - mid[i]) ** 2;
      const sd = Math.sqrt(s / n); upper.push(mid[i] + k * sd); lower.push(mid[i] - k * sd); pctB.push(sd > 0 ? (c[i] - (mid[i] - k * sd)) / (2 * k * sd) : 0.5);
    }
    return { mid, upper, lower, pctB };
  };
  E.stoch = (h, l, c, n = 14) => c.map((x, i) => { if (i < n - 1) return null; let hi = -Infinity, lo = Infinity; for (let j = i - n + 1; j <= i; j++) { hi = Math.max(hi, h[j]); lo = Math.min(lo, l[j]); } return hi > lo ? (100 * (x - lo)) / (hi - lo) : 50; });
  E.adx = (h, l, c, n = 14) => {
    const L = h.length, p = Array(L).fill(null), m = Array(L).fill(null), a = Array(L).fill(null);
    if (L < 2 * n + 1) return { plus: p, minus: m, adx: a };
    const tr = E.tr(h, l, c), pd = [0], md = [0];
    for (let i = 1; i < L; i++) { const u = h[i] - h[i - 1], d = l[i - 1] - l[i]; pd.push(u > d && u > 0 ? u : 0); md.push(d > u && d > 0 ? d : 0); }
    let st = 0, sp = 0, sm = 0; for (let i = 1; i <= n; i++) { st += tr[i]; sp += pd[i]; sm += md[i]; }
    const dx = [], di = (i) => { p[i] = st > 0 ? (100 * sp) / st : 0; m[i] = st > 0 ? (100 * sm) / st : 0; const s = p[i] + m[i]; return s > 0 ? (100 * Math.abs(p[i] - m[i])) / s : 0; };
    dx[n] = di(n); for (let i = n + 1; i < L; i++) { st = st - st / n + tr[i]; sp = sp - sp / n + pd[i]; sm = sm - sm / n + md[i]; dx[i] = di(i); }
    let ax = 0; for (let i = n; i < 2 * n; i++) ax += dx[i]; ax /= n; a[2 * n - 1] = ax; for (let i = 2 * n; i < L; i++) { ax = (ax * (n - 1) + dx[i]) / n; a[i] = ax; }
    return { plus: p, minus: m, adx: a };
  };
  E.obv = (c, v) => { let o = 0; return c.map((x, i) => { if (i > 0) o += x > c[i - 1] ? v[i] : x < c[i - 1] ? -v[i] : 0; return o; }); };
  E.cmf = (h, l, c, v, n = 20) => c.map((x, i) => { if (i < n - 1) return null; let mf = 0, vs = 0; for (let j = i - n + 1; j <= i; j++) { const r = h[j] - l[j]; mf += r > 0 ? (((c[j] - l[j]) - (h[j] - c[j])) / r) * v[j] : 0; vs += v[j]; } return vs > 0 ? mf / vs : null; });
  E.supertrend = (h, l, c, n = 10, m = 3) => {
    const atr = E.atr(h, l, c, n), L = c.length, dir = Array(L).fill(null), line = Array(L).fill(null); let fu = null, fl = null, d = 0;
    for (let i = n; i < L; i++) {
      const hl = (h[i] + l[i]) / 2, bu = hl + m * atr[i], bl = hl - m * atr[i], pc = c[i - 1];
      fu = fu == null || bu < fu || pc > fu ? bu : fu; fl = fl == null || bl > fl || pc < fl ? bl : fl;
      if (d === 0) d = c[i] >= hl ? 1 : -1; else if (d === -1 && c[i] > fu) d = 1; else if (d === 1 && c[i] < fl) d = -1;
      dir[i] = d; line[i] = d === 1 ? fl : fu;
    }
    return { dir, line };
  };
  E.roc = (c, n) => c.map((x, i) => (i < n ? null : x / c[i - n] - 1));
  E.dvol = (c, n) => c.map((x, i) => { if (i < n) return null; const r = []; for (let j = i - n + 1; j <= i; j++) r.push(c[j] / c[j - 1] - 1); const m = r.reduce((s, y) => s + y, 0) / n; return Math.sqrt(r.reduce((s, y) => s + (y - m) ** 2, 0) / (n - 1)); });
  E.build = (d) => {
    const { h, l, c, v } = d, hasVol = v.some((x) => x > 0);
    const S = { sma20: E.sma(c, 20), sma50: E.sma(c, 50), sma200: E.sma(c, 200), rsi: E.rsi(c), atr: E.atr(h, l, c), macd: E.macd(c), boll: E.boll(c), stoch: E.stoch(h, l, c), adx: E.adx(h, l, c), st: E.supertrend(h, l, c), roc21: E.roc(c, 21), roc63: E.roc(c, 63), roc126: E.roc(c, 126), vol63: E.dvol(c, 63), hasVol };
    if (hasVol) { S.obv = E.obv(c, v); S.cmf = E.cmf(h, l, c, v); }
    return S;
  };
  /** Four factor scores in [-1, 1]. Every input is causal, so the score on day i never uses later data. */
  E.factors = (d, S, i) => {
    const c = d.c;
    if (i < 200 || [S.adx.adx[i], S.st.dir[i], S.vol63[i], S.macd.hist[i], S.sma200[i], S.rsi[i], S.boll.pctB[i], S.atr[i]].some((x) => x == null)) return null;
    const a = S.atr[i], strength = 0.6 + 0.4 * Math.min(S.adx.adx[i] / 30, 1);
    const trend = clamp((0.3 * sgn(c[i] - S.sma50[i]) + 0.3 * sgn(c[i] - S.sma200[i]) + 0.2 * sgn(S.sma50[i] - S.sma200[i]) + 0.2 * S.st.dir[i]) * strength, -1, 1);
    const z = S.roc63[i] / Math.max(S.vol63[i] * Math.sqrt(63), 1e-9), rs = S.rsi[i], rsiS = rs > 75 ? -0.5 : ((rs - 50) / 50) * 0.6;
    const momentum = clamp(0.5 * Math.tanh(z / 1.5) + 0.25 * Math.tanh(S.macd.hist[i] / Math.max(0.3 * a, 1e-9)) + 0.25 * rsiS, -1, 1);
    let hi = -Infinity; for (let j = Math.max(0, i - 251); j <= i; j++) hi = Math.max(hi, c[j]);
    const dd = c[i] / hi - 1, ddS = dd < -0.2 ? -0.8 : dd < -0.1 ? -0.3 : 0.2, pb = S.boll.pctB[i], bbS = pb > 1 ? -0.4 : pb < 0 ? -0.2 : 0.1, ext = (c[i] - S.sma50[i]) / Math.max(a, 1e-9), extS = ext > 3 ? -0.6 : 0;
    const risk = clamp(0.5 * ddS + 0.3 * bbS + 0.2 * extS, -1, 1);
    let volume = null; if (S.hasVol && S.cmf[i] != null) volume = clamp(0.6 * clamp(S.cmf[i] / 0.25, -1, 1) + 0.4 * sgn(S.obv[i] - S.obv[i - 20]), -1, 1);
    return { trend, momentum, risk, volume };
  };
  E.WEIGHTS = { trend: 0.35, momentum: 0.3, risk: 0.2, volume: 0.15 };
  E.composite = (f, off = {}) => { let w = 0, s = 0; for (const k of Object.keys(E.WEIGHTS)) { if (f[k] == null || off[k]) continue; w += E.WEIGHTS[k]; s += E.WEIGHTS[k] * f[k]; } return w > 0 ? 50 + (50 * s) / w : 50; };
  E.scoreSeries = (d, S) => { const f = d.c.map((_, i) => E.factors(d, S, i)); return { factors: f, scores: f.map((x) => (x ? E.composite(x) : null)) }; };
  E.bucketOf = (s) => (s < 35 ? 0 : s < 50 ? 1 : s < 65 ? 2 : 3);
  E.forward = (c, i, h) => (i + h < c.length ? c[i + h] / c[i] - 1 : null);
  const summ = (a, h) => ({ n: a.length, windows: Math.floor(a.length / h), median: med(a), hit: a.length ? (100 * a.filter((x) => x > 0).length) / a.length : null });
  /** Out-of-sample check: the first 60% of scored days versus the last 40%, never mixed. */
  E.calibrate = (d, scores, h = 63) => {
    const idx = []; for (let i = 0; i < scores.length; i++) if (scores[i] != null && i + h < d.c.length) idx.push(i);
    if (idx.length < 150) return null;
    const cut = idx[Math.floor(idx.length * 0.6)], periods = { train: idx.filter((i) => i < cut), test: idx.filter((i) => i >= cut), all: idx }, out = { h, cut: d.t[cut] };
    for (const [name, list] of Object.entries(periods)) {
      const b = [[], [], [], []], base = []; for (const i of list) { const r = E.forward(d.c, i, h); b[E.bucketOf(scores[i])].push(r); base.push(r); }
      out[name] = { base: summ(base, h), buckets: b.map((x) => summ(x, h)), top: summ(b[3], h), weak: summ(b[0].concat(b[1]), h) };
    }
    const ok = (p) => p.top.windows >= 3 && p.weak.windows >= 3 && p.top.median != null && p.weak.median != null;
    const spread = (p) => (ok(p) ? p.top.median - p.weak.median : null), good = (p) => ok(p) && spread(p) >= 0.02 && p.top.median > p.base.median;
    const tr = out.train, te = out.test; let status = "insufficient";
    if (ok(tr) && ok(te)) status = good(tr) && good(te) ? "consistent" : good(tr) || good(te) ? "unstable" : "none";
    out.edge = { status, trainSpread: spread(tr), testSpread: spread(te) };
    return out;
  };
  /** Rule-based action from the score and context. Descriptive research triage, not advice. */
  E.decide = ({ score, factors, rsi, extATR, owned, weight = 0, edge = "insufficient" }) => {
    const extended = rsi >= 75 || extATR > 3, up = factors && factors.trend > 0.3, big = owned && weight >= 25;
    let label, tone, reason;
    if (!owned) {
      if (extended && score >= 50) { label = "Wait. Do not chase."; tone = "caution"; reason = "The trend is strong but price is stretched. A pullback gives a better entry and a closer stop."; }
      else if (score >= 65 && up) { label = "Buy in stages"; tone = "positive"; reason = "Trend, momentum and risk all line up. Enter in parts so one bad day does not set the whole cost."; }
      else if (score >= 55) { label = "Buy a starter"; tone = "positive"; reason = "More is supportive than not, but not decisively. A small start with room to add if it confirms."; }
      else if (score >= 45) { label = "Wait for confirmation"; tone = "neutral"; reason = "Mixed evidence. Wait for the trend and momentum to agree."; }
      else { label = "Avoid for now"; tone = "negative"; reason = "Most of the evidence is against it right now."; }
    } else if (extended && score >= 50) { label = big ? "Trim review. Take some off." : "Hold. Do not add."; tone = "caution"; reason = "Price is stretched. Protect gains with a stop rather than adding."; }
    else if (score >= 65) { label = big ? "Hold. Too large to add." : "Hold or add on pullbacks"; tone = "positive"; reason = big ? "The evidence is good, but this holding is already a large share of your money." : "Evidence is supportive. Add on dips toward the 50-day average, not on spikes."; }
    else if (score >= 45) { label = "Hold"; tone = "neutral"; reason = "Evidence is mixed. Keep the stop in place and review at the next report."; }
    else if (score >= 30) { label = "Trim review"; tone = "caution"; reason = "Evidence is weakening. Decide whether the original reason for owning it still holds."; }
    else { label = "Sell review"; tone = "negative"; reason = "Trend, momentum and risk have turned against it."; }
    const caveat = edge === "consistent" ? "" : edge === "unstable" ? " On this stock's history the score has helped only part of the time." : edge === "none" ? " On this stock's own history the score has not separated good days from bad ones, so lean on the risk plan." : " There is not enough history to test how well the score has worked here.";
    return { label, tone, reason: reason + caveat };
  };
  E.plan = ({ close, atr, stopLine, dir, account, riskPct, maxPct }) => {
    let stop = close - 2.5 * atr; if (dir === 1 && stopLine != null && stopLine < close && stopLine > stop) stop = stopLine;
    const R = close - stop, riskAmt = (account * riskPct) / 100, byRisk = Math.floor(riskAmt / R), cap = Math.floor((account * maxPct) / 100 / close), shares = Math.max(0, Math.min(byRisk, cap));
    return { stop, R, t1: close + 2 * R, t2: close + 3 * R, shares, value: shares * close, riskAmt, capped: cap < byRisk };
  };
  const splitLine = (line, delim) => { const out = []; let cur = "", q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === delim && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out; };
  E.parseCsv = (text) => {
    const lines = String(text).trim().split(/\r?\n/).filter((x) => x.trim()); if (lines.length < 2) throw new Error("Paste a header row and at least one data row.");
    const delim = [",", "\t", ";"].map((d) => [d, splitLine(lines[0], d).length]).sort((a, b) => b[1] - a[1])[0][0];
    const head = splitLine(lines[0], delim).map((x) => x.trim().toLowerCase().replace(/"/g, "")), col = (...names) => head.findIndex((x) => names.some((n) => x === n || x.startsWith(n)));
    const ci = { t: col("date", "time", "timestamp"), o: col("open"), h: col("high"), l: col("low"), c: col("close", "adj close", "price"), v: col("volume", "vol") };
    if (ci.t < 0 || ci.c < 0) throw new Error("Needs at least Date and Close columns.");
    const rows = [];
    for (const line of lines.slice(1)) {
      const p = splitLine(line, delim).map((x) => x.trim()), c = parseFloat(p[ci.c].replace(/,/g, "")), t = new Date(p[ci.t]);
      if (!(c > 0) || isNaN(t)) continue;
      const num = (k) => (ci[k] >= 0 && p[ci[k]] !== undefined && isFinite(parseFloat(p[ci[k]].replace(/,/g, ""))) ? parseFloat(p[ci[k]].replace(/,/g, "")) : c);
      const o = num("o"), hh = Math.max(num("h"), o, c), ll = Math.min(num("l"), o, c), v = ci.v >= 0 ? Math.max(0, parseFloat(p[ci.v].replace(/,/g, "")) || 0) : 0;
      rows.push({ t: t.toISOString().slice(0, 10), o, h: hh, l: ll, c, v });
    }
    rows.sort((a, b) => a.t.localeCompare(b.t)); const seen = new Set(), uniq = rows.filter((r) => (seen.has(r.t) ? false : seen.add(r.t)));
    if (uniq.length < 300) throw new Error("Need at least 300 daily rows (about 14 months). Found " + uniq.length + ".");
    return { t: uniq.map((r) => r.t), o: uniq.map((r) => r.o), h: uniq.map((r) => r.h), l: uniq.map((r) => r.l), c: uniq.map((r) => r.c), v: uniq.map((r) => r.v) };
  };
  E.demo = (n = 1600, seed = 7) => {
    let s = seed >>> 0; const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const g = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
    const T = [], O = [], H = [], Lw = [], C = [], V = []; let p = 100, drift = 0.0005, vol = 0.012, left = 0; const day = new Date("2020-01-02T00:00:00Z");
    while (C.length < n) {
      if (left <= 0) { drift = [0.0011, -0.0007, 0.0003, 0.0, 0.0009][Math.floor(rnd() * 5)]; vol = [0.009, 0.013, 0.018][Math.floor(rnd() * 3)]; left = 80 + Math.floor(rnd() * 200); } left--;
      while (day.getUTCDay() === 0 || day.getUTCDay() === 6) day.setUTCDate(day.getUTCDate() + 1);
      const r = drift + vol * g(), o = p * (1 + 0.002 * g()), c = p * (1 + r); p = c;
      T.push(day.toISOString().slice(0, 10)); O.push(o); C.push(c); H.push(Math.max(o, c) * (1 + Math.abs(g()) * 0.004)); Lw.push(Math.min(o, c) * (1 - Math.abs(g()) * 0.004)); V.push(Math.round(2e7 * Math.exp(0.3 * g()) * (1 + 18 * Math.abs(r))));
      day.setUTCDate(day.getUTCDate() + 1);
    }
    return { t: T, o: O, h: H, l: Lw, c: C, v: V };
  };
  if (typeof module !== "undefined" && module.exports) module.exports = E; else root.AurynEngine = E;
})(typeof window !== "undefined" ? window : globalThis);
