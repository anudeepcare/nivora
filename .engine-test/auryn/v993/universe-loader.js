"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationUniverseColumns = void 0;
exports.validationUniversePageRanges = validationUniversePageRanges;
exports.loadValidationUniversePages = loadValidationUniversePages;
exports.validationUniverseColumns = "symbol,name,exchange,instrument_type,currency,country";
function validationUniversePageRanges(total = 6000, pageSize = 1000) {
    const out = [];
    for (let from = 0; from < total; from += pageSize)
        out.push([from, Math.min(total - 1, from + pageSize - 1)]);
    return out;
}
async function loadValidationUniversePages(client, total = 6000, pageSize = 1000) {
    const rows = [];
    for (const [from, to] of validationUniversePageRanges(total, pageSize)) {
        const { data, error } = await client.from("nivora_market_universe").select(exports.validationUniverseColumns).eq("active", true).range(from, to);
        if (error)
            throw new Error(error.message);
        const page = data || [];
        rows.push(...page);
        if (page.length < (to - from + 1))
            break;
    }
    return rows;
}
