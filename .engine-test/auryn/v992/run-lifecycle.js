"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canResumeRun = canResumeRun;
exports.nextRunAttempt = nextRunAttempt;
exports.runIdentityKey = runIdentityKey;
exports.jobAttemptIdempotencyKey = jobAttemptIdempotencyKey;
function canResumeRun(status) { return status === "PENDING" || status === "RUNNING"; }
function nextRunAttempt(rows) { return Math.max(0, ...rows.map(x => Number(x.attempt || 0))) + 1; }
function runIdentityKey(kind, date, modelVersion, attempt) { return `auryn-v992:${kind}:${date}:${modelVersion}:attempt-${String(attempt).padStart(3, "0")}`; }
function jobAttemptIdempotencyKey(kind, date, modelVersion, attempt, batch) { return `${runIdentityKey(kind, date, modelVersion, attempt)}:batch-${String(batch).padStart(3, "0")}`; }
