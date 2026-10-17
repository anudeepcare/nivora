"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOutcomeSchedule = buildOutcomeSchedule;
const shadow_cio_1 = require("./shadow-cio");
function buildOutcomeSchedule(snapshotId, evaluationDate) { return shadow_cio_1.OUTCOME_HORIZONS.map((h) => ({ snapshotId, horizon: h, dueDate: (0, shadow_cio_1.outcomeDueAt)(evaluationDate, h) })); }
