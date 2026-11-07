"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/client";
import { validationTasks } from "@/lib/user-validation";
type Session = {
  body: {
    participant: string;
    task: string;
    completed: boolean;
    seconds: number;
    observedAt: string;
    notes: string;
  };
};
export default function OwnerValidation() {
  const [sessions, setSessions] = useState<Session[]>([]),
    [participant, setParticipant] = useState(""),
    [task, setTask] = useState<string>(validationTasks[0]),
    [seconds, setSeconds] = useState("120"),
    [completed, setCompleted] = useState(true),
    [consent, setConsent] = useState(false),
    [observedAt, setObservedAt] = useState(""),
    [notes, setNotes] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const r = await api<{ sessions: Session[] }>("owner/validation");
    setSessions(r.sessions);
  }, []);
  useEffect(() => {
    let active = true;
    load().catch(() => {
      if (active) setStatus("Observed sessions could not be loaded.");
    });
    return () => {
      active = false;
    };
  }, [load]);
  return (
    <section className="support">
      <h2>Observed user sessions</h2>
      <p>
        {new Set(sessions.map((s) => s.body.participant)).size} participant
        codes · {sessions.length} recorded tasks. Target: 20 real people. These
        are your observation notes, not automatically verified analytics.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("owner/validation", {
              participant,
              task,
              seconds: Number(seconds),
              completed,
              consent,
              observedAt: new Date(observedAt).toISOString(),
              notes,
            });
            await load();
            setStatus("Observation saved.");
          } catch (e) {
            setStatus(e instanceof Error ? e.message : "Save failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Anonymous participant code
          <input
            required
            value={participant}
            onChange={(e) => setParticipant(e.target.value)}
            placeholder="P001"
          />
        </label>
        <label>
          Task
          <select value={task} onChange={(e) => setTask(e.target.value)}>
            {validationTasks.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Observed at · your local time
          <input
            required
            type="datetime-local"
            value={observedAt}
            onChange={(e) => setObservedAt(e.target.value)}
          />
        </label>
        <label>
          Seconds
          <input
            required
            type="number"
            min="1"
            max="14400"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
          />
        </label>
        <label>
          Outcome
          <select
            value={String(completed)}
            onChange={(e) => setCompleted(e.target.value === "true")}
          >
            <option value="true">Completed without help</option>
            <option value="false">Needed help or could not finish</option>
          </select>
        </label>
        <label>
          Friction observed · no personal details
          <textarea
            maxLength={1500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          The participant consented to this observation
        </label>
        <button className="button" disabled={busy || !consent}>
          Save observed session
        </button>
      </form>
      {status && <p role="status">{status}</p>}
    </section>
  );
}
