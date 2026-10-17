"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPortfolioCioOverlay = applyPortfolioCioOverlay;
function applyPortfolioCioOverlay({ independentAction, portfolioRisk, owns, currentPositionPct = 0, sameArchetypeExposurePct = 0 }) {
    const reasons = [];
    if (independentAction === 'SELL' || independentAction === 'REDUCE') {
        reasons.push('The independent company decision is already defensive; portfolio context cannot upgrade it.');
        return { companyAction: independentAction, portfolioAction: 'REDUCE_EXPOSURE', maxNewPositionPct: 0, constrained: false, reasons };
    }
    if (independentAction === 'HOLD' || independentAction === 'INSUFFICIENT_EVIDENCE') {
        reasons.push('The independent company decision does not justify adding capital.');
        return { companyAction: independentAction, portfolioAction: 'HOLD', maxNewPositionPct: 0, constrained: false, reasons };
    }
    if (portfolioRisk.sizingGate === 'BLOCK ADD') {
        reasons.push('Portfolio concentration/correlation risk blocks additional exposure even though the standalone stock call is bullish.');
        return { companyAction: independentAction, portfolioAction: 'BLOCK_ADD', maxNewPositionPct: 0, constrained: true, reasons: [...reasons, ...portfolioRisk.notes] };
    }
    if (sameArchetypeExposurePct >= 50) {
        reasons.push(`Same-archetype exposure is already ${sameArchetypeExposurePct.toFixed(1)}%, so additional correlated exposure is blocked.`);
        return { companyAction: independentAction, portfolioAction: 'BLOCK_ADD', maxNewPositionPct: 0, constrained: true, reasons };
    }
    if (owns && currentPositionPct >= 15) {
        reasons.push(`Current position weight is already ${currentPositionPct.toFixed(1)}%, above AURYN's default add threshold.`);
        return { companyAction: independentAction, portfolioAction: 'BLOCK_ADD', maxNewPositionPct: 0, constrained: true, reasons };
    }
    let max = Math.max(0, portfolioRisk.maxNewPositionPct);
    let constrained = portfolioRisk.sizingGate === 'REDUCED';
    if (sameArchetypeExposurePct >= 35) {
        max = Math.min(max, 1.5);
        constrained = true;
        reasons.push('Archetype exposure is elevated; cap any add at a small satellite size.');
    }
    if (owns && currentPositionPct >= 10) {
        max = Math.min(max, 1);
        constrained = true;
        reasons.push('Existing position is already meaningful; only a small add is allowed.');
    }
    if (portfolioRisk.sizingGate === 'REDUCED')
        reasons.push('Portfolio risk requires reduced sizing.');
    if (!reasons.length)
        reasons.push('Portfolio context does not currently constrain the standalone bullish call.');
    return { companyAction: independentAction, portfolioAction: 'ADD', maxNewPositionPct: +max.toFixed(2), constrained, reasons };
}
