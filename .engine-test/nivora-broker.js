"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALPACA_PAPER_BASE_URL = exports.BROKER_CONTRACT_VERSION = void 0;
exports.authorizeBrokerExecution = authorizeBrokerExecution;
exports.BROKER_CONTRACT_VERSION = "v63-broker-1";
exports.ALPACA_PAPER_BASE_URL = "https://paper-api.alpaca.markets";
function authorizeBrokerExecution(x) {
    if (x.mode === "live")
        return { status: "APPROVAL_REQUIRED", mayTransmit: false, reason: "Live-money orders require explicit user approval and cannot be auto-submitted by Trading Lab.", version: exports.BROKER_CONTRACT_VERSION };
    if (!x.autoSubmit)
        return { status: "DISABLED", mayTransmit: false, reason: "Automatic paper submission is disabled.", version: exports.BROKER_CONTRACT_VERSION };
    return { status: "AUTHORIZED", mayTransmit: true, reason: "Autonomous execution is permitted only for the configured paper account.", version: exports.BROKER_CONTRACT_VERSION };
}
