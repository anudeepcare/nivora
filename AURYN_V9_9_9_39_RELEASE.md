# AURYN V9.9.9.39 — Trading Lab Current-Run Truth + UX

- Fixes pale/disabled-looking Trading Lab status headline.
- Separates evaluations belonging to the latest paper run from older audit history.
- A zero-decision run is explicitly shown as waiting for fresh canonical research, not as a successful no-trade decision.
- Old V9.3.5 provenance blocks are moved under Previous Checks instead of appearing as current decisions.
- Preserves V38 canonical provenance fix and confirmed working AURYN_BASE_URL + CRON_SECRET Portfolio Learning workflow.
- Autonomous paper execution remains paper-only: qualifying canonical decisions can pass safety gates and submit to Alpaca Paper; Portfolio Learning itself never authorizes trades.
