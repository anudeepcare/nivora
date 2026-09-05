# NIVORA Portfolio V2 Design

## Goal
Turn Portfolio from a dashboard/list into a premium decision-first wealth experience while preserving V65.25 portfolio calculations, persistence, and scoring.

## Experience
1. Command Center: portfolio value, period return/benchmark when real history exists, cash, health, concentration, and one concise portfolio interpretation.
2. Capital Map: group current evidence into Deploy, Hold/Wait, and Review/Reduce so the next action is obvious.
3. Visual Intelligence: performance, drivers, allocation, and risk remain available, but compact and useful; unavailable performance history never renders a fake chart.
4. Holdings: compact premium rows on desktop and clean cards on mobile. Decision is primary; edit/delete live in a quiet overflow menu.
5. Details: deeper health, x-ray, and risk are progressive disclosure, not the first screen.

## Visual System
Restrained private-wealth aesthetic. Strong numeric hierarchy, fewer borders, less empty space, subtle labels, low-attention info controls, green/amber/red only for meaning. Desktop and mobile have intentional layouts rather than breakpoint-stretched versions of one composition.

## Performance
Keep calculations memoized. Avoid additional quote/API requests for presentation. Do not mount heavy/deep portfolio sections until requested where possible. Keep visual components driven by already-loaded pulse data.
