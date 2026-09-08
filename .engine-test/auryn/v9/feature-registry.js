"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_CONTEXTS = exports.RESEARCH_HORIZONS = exports.FEATURE_TRANSFORMS = exports.FEATURE_FAMILIES = void 0;
exports.generateFeatureCatalog = generateFeatureCatalog;
exports.featureCatalogSummary = featureCatalogSummary;
const B = (family, theory, ...metrics) => metrics.map(baseMetric => ({ family, theory, baseMetric }));
const BASE = [
    ...B('TREND', 'MOVING_AVERAGE', 'sma20', 'sma50', 'sma100', 'sma200', 'ema20', 'ema50', 'ma_stack', 'ma_slope'),
    ...B('TREND', 'ICHIMOKU', 'ichimoku_cloud', 'tenkan_kijun', 'chikou_state'),
    ...B('MOMENTUM', 'RSI', 'rsi14', 'rsi5', 'rsi21', 'rsi_regime'),
    ...B('MOMENTUM', 'MACD', 'macd_line', 'macd_histogram', 'macd_signal'),
    ...B('MOMENTUM', 'ADX_DMI', 'adx14', 'dmi_plus', 'dmi_minus'),
    ...B('MOMENTUM', 'OSCILLATORS', 'stochastic', 'cci20', 'roc20', 'mfi14'),
    ...B('VOLATILITY', 'BOLLINGER', 'bollinger_percent_b', 'bollinger_width'),
    ...B('VOLATILITY', 'KELTNER', 'keltner_position', 'squeeze_state'),
    ...B('VOLATILITY', 'ATR', 'atr14', 'realized_vol20', 'realized_vol60'),
    ...B('VOLUME_FLOW', 'VOLUME', 'relative_volume', 'volume_dryup', 'breakout_volume'),
    ...B('VOLUME_FLOW', 'FLOW', 'obv_slope', 'cmf20', 'accumulation_distribution'),
    ...B('STRUCTURE_PATTERN', 'PRICE_STRUCTURE', 'higher_high_low', 'support_distance', 'resistance_distance', 'gap_state', 'base_stage', 'breakout_state'),
    ...B('STRUCTURE_PATTERN', 'FIBONACCI', 'fib_382', 'fib_500', 'fib_618', 'fib_786', 'fib_extension_1272', 'fib_extension_1618'),
    ...B('STRUCTURE_PATTERN', 'ELLIOTT', 'elliott_impulse_state', 'elliott_corrective_state'),
    ...B('STRUCTURE_PATTERN', 'WYCKOFF', 'wyckoff_phase', 'spring_upthrust_state'),
    ...B('STRUCTURE_PATTERN', 'WEINSTEIN', 'weinstein_stage'),
    ...B('STRUCTURE_PATTERN', 'DARVAS', 'darvas_box_state'),
    ...B('RELATIVE_STRENGTH', 'RELATIVE_STRENGTH', 'rs_vs_spy', 'rs_vs_qqq', 'rs_vs_sector', 'rs_vs_peers'),
    ...B('RELATIVE_STRENGTH', 'ANCHORED_VWAP', 'anchored_vwap_earnings', 'anchored_vwap_swing', 'vwap_distance'),
    ...B('FUNDAMENTALS', 'GROWTH', 'revenue_growth', 'revenue_acceleration', 'eps_growth', 'fcf_growth'),
    ...B('FUNDAMENTALS', 'BALANCE_SHEET', 'net_cash_debt', 'leverage', 'liquidity', 'dilution_rate'),
    ...B('EARNINGS', 'REVISIONS', 'eps_revision_breadth', 'revenue_revision_breadth', 'estimate_dispersion', 'guidance_delta', 'surprise_streak'),
    ...B('QUALITY', 'QUALITY', 'gross_margin', 'operating_margin', 'fcf_margin', 'roic', 'roe', 'cash_conversion'),
    ...B('QUALITY', 'CAN_SLIM', 'can_slim_growth', 'can_slim_leadership', 'can_slim_sponsorship'),
    ...B('VALUATION', 'VALUATION', 'forward_pe', 'ev_sales', 'ev_ebitda', 'fcf_yield', 'growth_adjusted_valuation', 'historical_valuation_percentile'),
    ...B('NARRATIVE_CATALYST', 'NARRATIVE', 'thesis_direction', 'narrative_change', 'management_execution', 'competitive_change'),
    ...B('NARRATIVE_CATALYST', 'CATALYST', 'catalyst_density', 'earnings_proximity', 'contract_momentum', 'regulatory_milestone'),
    ...B('SECTOR_MACRO', 'SECTOR', 'sector_relative_strength', 'industry_breadth', 'peer_revision_breadth'),
    ...B('SECTOR_MACRO', 'MACRO', 'rates_regime', 'liquidity_regime', 'credit_regime', 'vix_regime', 'dollar_sensitivity'),
    ...B('OPTIONS_POSITIONING', 'OPTIONS', 'iv_rank', 'iv_skew', 'put_call_oi', 'expected_move', 'gamma_concentration'),
    ...B('MICROSTRUCTURE', 'MICROSTRUCTURE', 'bid_ask_spread', 'quote_imbalance', 'liquidity_score', 'slippage_estimate', 'price_impact'),
    ...B('PORTFOLIO_CONTEXT', 'PORTFOLIO', 'position_concentration', 'factor_correlation', 'sector_concentration', 'portfolio_beta'),
];
exports.FEATURE_FAMILIES = [...new Set(BASE.map(x => x.family))];
exports.FEATURE_TRANSFORMS = ['LEVEL', 'SLOPE', 'ACCELERATION', 'PERCENTILE', 'DIVERGENCE', 'CROSSOVER', 'ZSCORE', 'REGIME_NORMALIZED'];
exports.RESEARCH_HORIZONS = ['1D', '5D', '20D', '90D', '180D', '1Y'];
exports.FEATURE_CONTEXTS = ['NONE', 'SECTOR_CONFIRM', 'MARKET_REGIME', 'VOLUME_CONFIRM', 'TREND_CONFIRM', 'VALUATION_CONFIRM', 'EARNINGS_CONFIRM', 'RISK_CONFIRM'];
function generateFeatureCatalog(options = {}) {
    const limit = Math.max(0, Math.floor(options.limit ?? Number.MAX_SAFE_INTEGER));
    const out = [];
    outer: for (const base of BASE)
        for (const transform of exports.FEATURE_TRANSFORMS)
            for (const horizon of exports.RESEARCH_HORIZONS)
                for (const context of exports.FEATURE_CONTEXTS) {
                    const id = `${base.family}:${base.theory}:${base.baseMetric}:${transform}:${horizon}:${context}`;
                    out.push({ id, baseMetric: base.baseMetric, family: base.family, theory: base.theory, transform, horizon, context });
                    if (out.length >= limit)
                        break outer;
                }
    return out;
}
function featureCatalogSummary() {
    const catalog = generateFeatureCatalog();
    const byFamily = Object.fromEntries(exports.FEATURE_FAMILIES.map(f => [f, catalog.filter(x => x.family === f).length]));
    return { candidateCount: catalog.length, baseMetricCount: BASE.length, familyCount: exports.FEATURE_FAMILIES.length, byFamily, theoryCount: new Set(catalog.map(x => x.theory)).size };
}
