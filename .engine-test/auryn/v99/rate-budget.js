"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerBudget = void 0;
exports.callsNeededForBatch = callsNeededForBatch;
const jobs_1 = require("./jobs");
exports.providerBudget = { providerLimit: jobs_1.PROVIDER_CALLS_PER_MINUTE, backgroundLimit: jobs_1.BACKGROUND_CALLS_PER_MINUTE, interactiveHeadroom: jobs_1.PROVIDER_CALLS_PER_MINUTE - jobs_1.BACKGROUND_CALLS_PER_MINUTE };
function callsNeededForBatch(symbols, callsPerSymbol = 1) { return Math.max(1, Math.ceil(symbols * Math.max(.1, callsPerSymbol))); }
