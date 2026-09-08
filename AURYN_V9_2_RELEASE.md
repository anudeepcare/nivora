# AURYN V9.2 — Historical Data Backfill

V9.2 is the historical evidence layer upstream of the V9.1 observation factory. Its milestone is not "the code compiles"; it is a real point-in-time replay bundle that passes the automated V9.2 data gate.

## Canonical scope
V9.2 supports these historical families:
- adjusted daily price/volume from Twelve Data with explicit date bounds and `adjust=all`;
- split and dividend histories, independently retained as corporate-action evidence;
- SEC Company Facts with `filed` as public `availableAt` and economic period end kept separate;
- full historical earnings releases with point-in-time EPS estimate/actual/surprise and derived `surprise_streak`;
- revision and sector research rows only when an explicit public `availableAt` is supplied;
- FRED/ALFRED-style macro vintages using `realtime_start` as the point-in-time availability boundary;
- explicit security master, dated universe membership, delisted-name records, and delisting-return handling.

All normalized families feed the existing V9.1 `HistoricalReplayBundle`. Global macro rows use the reserved `__MACRO__` symbol and are resolved point-in-time for each security.

## Automated acceptance gate
The strict real-data gate checks:
- point-in-time availability / look-ahead safety;
- ascending timestamps and duplicate bars;
- split/dividend evidence and split-like adjusted-price corruption;
- missing security bars and benchmark-session gaps using each security's active window;
- survivorship claims, dated universe snapshots, delisted names, and delisting returns;
- contradictory point-in-time facts;
- canonical family presence/adapter coverage for `FUNDAMENTALS,EARNINGS,REVISION,SECTOR,MACRO,CORPORATE_ACTIONS`;
- minimum symbol coverage, minimum history, and `DECISION_GRADE` quality.

Pass condition before V9.3: **0 hard integrity failures, 0 corporate-action corruption, no timestamp-order violations, no look-ahead violations, configured gap/coverage floors satisfied, and the machine-readable coverage report produced.**

## Commands
Normalize recorded provider payloads without network access:
```bash
npm run normalize:v92 -- --input=/path/raw-provider-bundle.json --output=/path/replay-bundle.json
```

Network backfill (prices + SEC by default; expensive Twelve Data fundamental endpoints are explicit opt-ins):
```bash
TWELVE_DATA_API_KEY=... SEC_USER_AGENT="AURYN contact@example.com" FRED_API_KEY=... \
npm run backfill:v92 -- \
  --symbols=/path/security-master.json \
  --start-date=2016-01-01 --end-date=2026-09-08 --benchmark=SPY \
  --with-corporate-actions --with-earnings \
  --research-events=/path/point-in-time-research-events.json \
  --fred-series=/path/fred-series.json \
  --universe=/path/universe-history.json \
  --output=/path/auryn-v92-replay.json
```

Strict release gate:
```bash
AURYN_V92_REPLAY_BUNDLE=/path/auryn-v92-replay.json npm run gate:v92 -- --require-data
```

## Safety boundary
V9.2 is research-only. There is no automatic production promotion. It does not change CIO weights, approve V9 research candidates, write the production feature registry, place orders, or relax Market Truth/broker gates. A missing required family stays missing and blocks the strict gate; it is never coerced to zero or silently treated as complete.

## 24/7 Market Truth hotfix
AURYN research must remain usable outside the regular session. The V9.2 package therefore preserves the strict regular-session execution gate while making Market Truth session-aware:
- regular-session stale/disagreeing live quotes still fail closed;
- fresh pre-market/after-hours agreement is research context only and never grants regular-session execution permission;
- stale, delayed, unavailable, or conflicting extended-hours quotes automatically fall back to the last verified regular close instead of blanking research;
- overnight, weekend, and holiday research remains anchored to the last completed regular close;
- early-close sessions use the actual exchange close timestamp;
- ambiguous cross-listed symbols can carry provider venue/currency hints (SAP is pinned to NYSE/USD);
- an official-close display never reuses an extended-hours percent change.

This hotfix does not advance the roadmap version. V9.2 remains blocked until the real historical replay bundle passes the strict data gate.

## Release state
A code-only package can pass the implementation/regression gates while the V9.2 milestone itself remains **BLOCKED**. V9.2 is complete only after a real replay bundle passes the strict command above. Only then may AURYN move to V9.3 Feature Tournament.
