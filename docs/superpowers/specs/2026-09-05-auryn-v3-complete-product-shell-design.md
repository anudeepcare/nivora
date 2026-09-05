# AURYN V3 Complete Product Shell Design

## Objective
Finish the AURYN V3 migration so every active product surface looks and behaves like one product. Preserve the decision engine and data behavior while eliminating raw/default-looking sections, legacy NIVORA copy, missing product chrome, and incomplete legal navigation.

## Required product shell
Every authenticated surface uses `AppShell` with:
- sticky AURYN header on desktop/tablet
- Research, Portfolio, Monitor, Lab primary navigation
- contextual investment search and account access
- mobile bottom navigation with safe-area compensation
- a persistent AURYN product footer after page content

The product footer exposes About, Methodology, Terms of Use, Privacy Policy, and Risk Disclosure, plus the research-only/risk statement.

## Portfolio
Portfolio must be visually complete from top to bottom. `PortfolioPulse`, visual intelligence, capital priorities, holdings, evidence expansion, allocation, and risk must use AURYN V3 presentation classes rather than relying on older portfolio CSS. No browser-default buttons, grids, or unstyled text blocks are acceptable.

## Stock analysis
The stock route must remain inside `AppShell`. The answer-first stock summary remains primary. Deeper evidence may temporarily preserve existing data-rendering logic, but it must live inside a deliberate AURYN evidence surface with consistent typography, borders, spacing, tabs, metric cards, and section hierarchy. Old styling must not visually dominate the page.

## Monitor and Lab
Monitor and Trading Lab keep existing behavior. Both use the same AURYN shell and footer. Lab remains explicitly Alpaca Paper only / no live money.

## Legal/product navigation
Public/authenticated users can always reach:
- About
- Methodology
- Terms of Use
- Privacy Policy
- Risk Disclosure

Login/Register also surface these routes without requiring authentication.

## Copy
No user-visible `NIVORA` copy is permitted on migrated AURYN screens. Internal code/module names may remain where changing them would risk engine behavior.

## Responsive contract
At 360, 390, 430, 768, 1024, 1440 and 1728 CSS px:
- no page-level horizontal overflow
- no content hidden behind mobile bottom navigation
- no clipped metric grids
- footer is readable and reachable
- desktop density remains useful without giant empty canvases

## Non-goals
- no live-money trading
- no scoring-weight changes
- no provider or Supabase migrations
