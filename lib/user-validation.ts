export const validationTasks = [
  "company-research",
  "explain-evidence",
  "save-thesis",
  "monthly-plan",
  "find-methodology",
] as const;
export function cleanValidationSession(
  v: Record<string, unknown>,
  now: string,
) {
  const participant = String(v.participant ?? "").trim(),
    task = String(v.task ?? ""),
    observedAt = String(v.observedAt ?? ""),
    seconds = Number(v.seconds);
  if (v.consent !== true)
    throw Error("Record only a consenting observed session.");
  if (!/^[A-Za-z0-9_-]{3,32}$/.test(participant))
    throw Error("Use an anonymous participant code, 3–32 letters/numbers.");
  if (
    !validationTasks.includes(task as (typeof validationTasks)[number]) ||
    typeof v.completed !== "boolean" ||
    !Number.isFinite(seconds) ||
    seconds < 1 ||
    seconds > 14400
  )
    throw Error("Choose a task, outcome and valid duration.");
  const when = Date.parse(observedAt);
  if (!Number.isFinite(when) || when > Date.parse(now))
    throw Error("Use the actual past observation time.");
  return {
    participant,
    task,
    observedAt: new Date(when).toISOString(),
    seconds,
    completed: v.completed,
    consent: true,
    notes: typeof v.notes === "string" ? v.notes.trim().slice(0, 1500) : "",
  };
}
