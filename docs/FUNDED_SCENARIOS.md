# Valuation presentation and funded operating scenarios — 2026-10-19

## What changed

Forecast-multiple outputs are removed from the Overview headline and the valuation triangulation chart. They remain opt-in, collapsed and labelled exploratory in Value. Analyst target consensus remains a separate opinion. This supersedes the prior IREN correction as a headline valuation approach.

Value includes a Bear/Base/Bull operating-scenario workbench. No future operating, funding or exit-multiple inputs are silently filled from current market pricing. Source/rationale notes are required for each personal case. The model is for operating businesses, including infrastructure/development scenarios with explicit assumptions; it does not apply this EBITDA framework to financial companies or crypto. Missing inputs remain unknown. The workbench does not fix ASTS listing reconciliation or generate sourced automatic targets for every stock.

## Model

Starting revenue moves along a smooth geometric annual path to the supplied terminal revenue. Annual operating cash is revenue × assumed operating cash margin (after working capital, taxes and existing-debt interest). All new debt and equity financing occurs at inception. New-debt interest is paid annually. Capex is evenly phased across the horizon. A negative cash balance in any year blocks valuation and reports the funding gap for that year.

Ending debt = starting debt + new debt. Ending shares = (starting shares + new equity / issue price) × (1 + annual dilution)^years. Terminal enterprise value = terminal revenue × terminal EBITDA margin × explicitly assumed exit EV/EBITDA. Equity value = max(0, terminal EV − ending debt + ending cash). Future price divides this by ending shares. Present value discounts that future price at the supplied required return.

## Limits

Personal assumptions, not verified forecasts or recommendations. No probabilities are assigned. No debt amortization, dividends, interim distributions, interest on retained cash, intra-year cash timing, sector capacity validation or financing availability checks. A funded case is mathematically funded under its assumptions; this does not establish that capital will be available or that the forecast is achievable. It does not independently price options or bank equity. Inputs are temporary, never sent to a provider or saved to the database, and reset when the Value view closes.

Automatic sourced infrastructure/development valuation requires additional forward operational, capex and financing evidence. APIs supplying annual revenue estimates alone do not establish those assumptions. No competitor values are copied or used as ground truth. Existing manual DCF and specialist functions are separate illustrations.

## Verification

Tests cover annual cash reconciliation, financing gaps, equity issuance dilution, new debt interest and terminal claims, required-return discounting, invalid inputs and headline exclusion. Build/API logs are in verification/funded-scenarios-*. Physical iPhone standalone rendering and production deployment are not verified. The PWA shell, viewport handling and navigation geometry were not edited.

Methodological reference: Aswath Damodaran, NYU Stern, “Growth companies: Value drivers” (https://people.stern.nyu.edu/adamodar/New_Home_Page/littlebook/growthvaluedrivers.htm). The requirement to fund reinvestment informs this correction; this simplified terminal scenario is not a reproduction of or validation by that model.
