"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyResearchContext = applyResearchContext;
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const sameDirection = (signal, confirmation) => signal > 0 ? confirmation > 0 : signal < 0 ? confirmation < 0 : false;
function applyResearchContext(context, signal, current) {
    if (!finite(signal) || Math.abs(signal) < 1e-12)
        return null;
    if (context === 'NONE')
        return signal;
    let confirmation = null;
    switch (context) {
        case 'SECTOR_CONFIRM':
            confirmation = finite(current.metrics.sector_relative_strength) ? current.metrics.sector_relative_strength : null;
            break;
        case 'MARKET_REGIME':
            confirmation = current.regime === 'RISK_ON' ? 1 : current.regime === 'RISK_OFF' || current.regime === 'HIGH_VOL' ? -1 : null;
            break;
        case 'VOLUME_CONFIRM':
            confirmation = finite(current.metrics.relative_volume) ? current.metrics.relative_volume : null;
            break;
        case 'TREND_CONFIRM':
            confirmation = finite(current.metrics.ma_stack) ? current.metrics.ma_stack : finite(current.metrics.sma200) ? current.metrics.sma200 : null;
            break;
        case 'VALUATION_CONFIRM':
            confirmation = finite(current.metrics.fcf_yield) ? current.metrics.fcf_yield : finite(current.metrics.growth_adjusted_valuation) ? -current.metrics.growth_adjusted_valuation : null;
            break;
        case 'EARNINGS_CONFIRM':
            confirmation = finite(current.metrics.eps_revision_breadth) ? current.metrics.eps_revision_breadth : finite(current.metrics.guidance_delta) ? current.metrics.guidance_delta : null;
            break;
        case 'RISK_CONFIRM': {
            const vol = current.metrics.realized_vol20;
            if (!finite(vol))
                confirmation = null;
            else
                confirmation = signal > 0 ? (vol <= 35 ? 1 : -1) : (vol >= 25 ? -1 : 1);
            break;
        }
    }
    if (!finite(confirmation) || !sameDirection(signal, confirmation))
        return null;
    return signal;
}
