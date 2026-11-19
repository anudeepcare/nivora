import styles from "./EvidenceDetails.module.css";

/** Keep complete evidence accessible without turning each table row into a paragraph. */
export default function EvidenceDetails({
  reason,
  entry,
  holding,
  summary = "Evidence & action context",
}: {
  reason: string;
  entry?: string;
  holding?: string;
  summary?: string;
}) {
  return (
    <details className={styles.details}>
      <summary>{summary}</summary>
      <p>{reason}</p>
      {(entry || holding) && (
        <dl>
          {entry && (
            <div>
              <dt>New purchase</dt>
              <dd>{entry}</dd>
            </div>
          )}
          {holding && (
            <div>
              <dt>Existing holding</dt>
              <dd>{holding}</dd>
            </div>
          )}
        </dl>
      )}
    </details>
  );
}
