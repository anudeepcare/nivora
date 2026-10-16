# AURYN — premium product direction

The October 16 revision implements the approved mockup hierarchy in the existing application. The product remains centered on business quality, independent valuation and market timing. A concise first view leads to detailed, inspectable evidence.

## Product presentation

- Mobile navigation uses restrained glass, safe-area padding and clear active states. Desktop has a navy workspace sidebar. Financial content uses opaque surfaces for contrast.
- Research home has one search and personal saved/recent research. Search puts an exact ticker first, so APP is not displaced by AAPL.
- Company identity, prices, charts, metric cards and source disclosures share the same spacing and numeric alignment. Metric help opens with a tap or keyboard activation.
- Research lenses remain independent. Technical levels do not become business fair value. Model scores are not win probabilities.
- Portfolio and watchlist rows link into research. Positions show available per-unit price, quantity, market value and unrealized return, with source timing in details.

## Valuation interpretation

The exploratory workbench uses reported annual operating cash flow and cash capital expenditure, compatible currency, dated diluted shares, and explicitly editable assumptions. It does not replace or unlock the verified canonical valuation engine. Its result is a scenario, not a verified fair value or an executable buy instruction.

APP's 2025 report includes discontinued operations in reported cash flow. The workbench can show those reported figures but must not silently project them as continuing-business cash flow. Negative FCF, unsupported business models, crypto, missing shares and incompatible sources have explicit blocked states. Synthetic test fixtures are marked as such.

## Quotes and operating cost

No new paid dependency or subscription was added. Stock quotes retain existing provider contracts. Crypto display quotes use timestamped Coinbase data with a 24/7 session and remain blocked for execution. Portfolio requests are serial small batches; partial failures preserve successfully fetched values.

While visible, quote refresh rotates at most six symbols per minute. A 30-investment portfolio can take about five minutes plus provider latency to revisit every symbol. Old prices are labeled stale rather than advertised as live. This budget does not guarantee simultaneous streaming quotes for every holding. Closed-market official closes are not needlessly polled.

## Delivery and verification

Read `verification/VERIFICATION_REPORT.md` for the exact final checks and limitations, and `DEPLOYMENT.md` for copying this source into the existing Git checkout and pushing to GitHub/Vercel. The ZIP is full source, not a deployed change. Approved concept boards are in `docs/redesign/approved-2026-10-16/`; their illustrative numbers and marketing claims are not product evidence.

Actual login/email, user database mutations, paper order/fill/cancel operations and physical iPhone Safari require configured-environment acceptance. Offline browser fixtures establish layout and client behavior; they do not establish external service success.
