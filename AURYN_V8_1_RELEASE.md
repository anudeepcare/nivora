# AURYN V8.1 — Market Truth Hotfix + 500-Symbol Live Audit

V8.1 is the focused Market Truth safety release on top of V8 Reality Audit & CIO Consistency. It fixes the systemic issue exposed by the first deployed 100-ticker live audit, where closed-market research snapshots were incorrectly interpreted by the audit as execution-tradable because `priceSensitiveAllowed` was overloaded as a tradability signal.

## Root cause fixed

AURYN now separates three concepts explicitly:

1. **Research-safe price** — a canonical price may be used for research/valuation/technical context.
2. **Execution-tradable price** — only independently verified fresh live providers can authorize autonomous paper execution.
3. **Blocked price** — provider disagreement, stale data, or missing verification prevents price-sensitive research and execution.

Closed-market official closes and single-source live quotes are research-capable but **never execution-tradable**.

## Canonical price-use states

- `LIVE_EXECUTION` — two fresh providers agree within tolerance; research and paper execution may proceed.
- `RESEARCH_LIVE_SINGLE_SOURCE` — one fresh source is usable for research, but paper execution is blocked.
- `RESEARCH_CLOSE` — last verified regular close is usable while the exchange is closed; paper execution is blocked.
- `BLOCKED` — price cannot be trusted for price-sensitive research or execution.

## Provider-gap semantics

Provider gap is now decision-relevant only when providers are being compared for the same active market session. A stale Alpaca print and a closed-market Twelve Data context price are no longer presented as a live provider-disagreement signal for an official-close snapshot.

The raw closed-session gap remains available only as `contextProviderGapPct` for diagnostics.

## Paper broker hardening

Alpaca Paper automation and diagnostics now require `LIVE_VERIFIED` quote integrity. A single fresh provider is insufficient for autonomous execution even if it is usable for research.

## Live audit hardening

The live audit no longer equates `priceSensitiveAllowed` with tradability. It separately checks:

- research-safe price state
- execution-tradable state
- official-close non-tradability
- provider disagreement on execution-ready quotes
- canonical quote vs analyze price consistency
- blocked states exposing no decision price

The same runner now supports **1–500 symbols**.

### 100-symbol validation

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v81-live
```

### 500-symbol live-market validation

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v81-live -- --limit=500
```

No `AURYN_BASE_URL` Vercel environment variable is required. It is supplied temporarily in the Mac/VS Code terminal command.

## 500-symbol universe

For runs above the fixed 100-ticker golden universe, V8.1 requests a broad live validation universe from `/api/audit/universe`, prioritizing the persisted investment-scan universe and falling back to the active market universe. The endpoint returns symbols only and is capped at 500.

## Release gates

- full regression suite: must pass
- 100-ticker offline Reality Audit: 100/100
- V65 production/dead-code audit: pass
- live 100/500 audit: must report zero critical execution-tradability violations before any autonomous paper expansion
- live-money autonomous execution remains disabled
