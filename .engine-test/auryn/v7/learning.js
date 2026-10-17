"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeV7Decision = serializeV7Decision;
const learning_1 = require("../v6/learning");
function serializeV7Decision(v7) {
    return {
        ...(0, learning_1.serializeV6Decision)(v7.v6),
        version: v7.version,
        engineVersion: v7.engineVersion,
        trust: { state: v7.trust.state, score: v7.trust.score, blockers: v7.trust.blockers, warnings: v7.trust.warnings },
    };
}
