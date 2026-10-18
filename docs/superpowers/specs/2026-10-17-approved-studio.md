# Approved AURYN studio design

The user approved the revised `AURYN-Design-Review.html` on October 17, 2026 and authorized implementation. The frozen full reference is `docs/design/approved-studio-20261017.html`. Its embedded styles, spacing, typography, company assets, light/dark treatments and mobile/desktop layouts define the visual target. Earlier design references are superseded.

## Product contract

- Replace the old sidebar with the approved top navigation; use Home, Research, Watchlist and Portfolio. Mobile uses the approved floating four-item dock, safe-area padding and readable controls.
- Research shows company identity and price, five compact tabs (Overview, Financials, Value, Technicals, Thesis), the contrasting research canvas, a buy/owner context switch, concise decision, monthly DCA, price history, outlook, key financials and strengths/risks.
- Keep DCA amount-free, show 0×–4×, and distinguish completed from forming months. Preserve the existing original experimental policy rather than inventing a competitor algorithm.
- Settings is a compact sheet with appearance, text size, motion, account and tools. Login has no application navigation. Existing auth, provider, watchlist, portfolio, alert and paper safeguards remain connected.
- Retain EODHD and Twelve Data routing, caching, asset identity and reporting-currency checks. Do not copy illustrative CRM targets, technical readings or chart paths into live research. Numbers in the design demonstrate presentation, not a verified forecast.
- Real outlook values must name their model, inputs, date, horizon and limitations. A company without sufficient inputs gets a concise data state in the same visual space. Do not label consensus as AURYN fair value.
- Primary navigation restores the last position after data is ready. Tapping the active item does nothing. Delayed content must not produce a second visible jump or replay a restoration after deliberate user scrolling. Research tabs preserve their own position.
- Do not add the removed purchase-impact, stress, import, private thesis, snapshot or comparison panels.
- No paid AI activation, provider purchase, broker submission, production database migration, force push or production deployment is part of this source build.

## Acceptance

User follow-up: data/metric selection must match the mockup exactly, with no extra or redundant primary panels. Overview: quote/change, decision/context, DCA, chart, outlook, Revenue/Operating margin/Cash after capex/Forward P/E, strengths/risks. Financials: Revenue/Operating margin/Cash after capex/Net debt plus the four-row Income/Cash flow/Balance sheet table. Value: three cases, case explanations and P/E TTM/Forward P/E/EV revenue. Technicals: RSI/MACD/relative volume/ATR, Fibonacci references and DCA; deeper anchor controls are a disclosure. Thesis: up to three evidence-based drivers/risks, three watch points and three questions. Do not add standalone forecast, ownership, dividend, news, financial-grid or repeated earnings panels to these primary screens.

Run the existing full domain suite, TypeScript, production build and fixture-backed API tests. Add behavior coverage for delayed scroll restoration, active navigation, scenario units/currency/data gaps and decision-context selection. Compare rendered views against the frozen reference only if supported browser control is available. Record unsupported browser and physical-iPhone acceptance explicitly; compilation cannot prove pixel parity.
