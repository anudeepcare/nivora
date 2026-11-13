# Portfolio comparison refinement

Goal: make the existing Portfolio screen compact, colorful and useful without presenting reconstructed holdings history as the user's actual returns.

Architecture: retain the existing USD-only current-quantity history and provider/cache route. Add SPY as explicitly labeled US equity market context. Match actual observation dates before rebasing both series to zero; never interpolate prices or fabricate a benchmark. Keep source, coverage and limitations accessible. Preserve the holdings grid and every existing scenario calculation.

Files: ApprovedPortfolioChart and scoped CSS own the chart, controls, inspection and separate full-width range section. PortfolioPage and PortfolioWorkspace CSS coordinate the chart/sidebar/range/ledger rows. A pure portfolio-comparison helper owns date-window selection, shared-date alignment and normalized price changes. approved-workspace gets an optional observation limit, retaining its old default for existing callers. PortfolioRange presentation is tightened without changing range math.

1. Add failing tests for aligned normalization, missing benchmark, short overlap, invalid observations, periods and the longer optional history window.
2. Implement pure helpers and rerun targeted tests.
3. Replace the red-only value chart with teal holdings, dashed violet SPY, 1M/3M/6M controls, a value toggle, shared-date percentages and accessible keyboard/touch inspection.
4. Separate the range from the trend so it fills the desktop row rather than leaving an empty sidebar. Preserve bear/base/bull in amber/blue/teal, disclosures and full-width holdings.
5. Run full tests, formatting/lint/typecheck/build and inspect desktop/mobile/dark populated, missing-data and short-history states. Record any unavailable live provider or browser verification explicitly.

Constraints: no new dependencies, deployment, push, purchases, fake portfolio returns or new user-data transmission. SPY is broad US equity price context, not a risk-matched benchmark for every asset mix. Existing preview fixtures stay test-only.
