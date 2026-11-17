import type { IntelligenceRow } from "@/lib/sentisense-view";
import layout from "./IntelligenceTable.module.css";
import s from "./SentiSensePanels.module.css";
/** One comparison surface for every provider dataset; citations never dictate row height. */
export default function IntelligenceTable({
  rows,
  title,
  dateHeading = "Date",
}: {
  rows: IntelligenceRow[];
  title: string;
  dateHeading?: string;
}) {
  const columns = [
    ...new Set(rows.flatMap((row) => row.cells.map((cell) => cell.label))),
  ];
  return (
    <div
      className={s.tableRegion}
      tabIndex={0}
      role="region"
      aria-label={`${title} records`}
    >
      <table className={s.table}>
        <caption className="sr-only">
          {title}. Missing values are shown as not supplied.
        </caption>
        <thead>
          <tr>
            <th scope="col">Record</th>
            <th scope="col">{dateHeading}</th>
            {columns.map((label) => (
              <th scope="col" key={label}>
                {label}
              </th>
            ))}
            {rows.some((row) => row.text) && (
              <th scope="col">Provider summary</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.label}:${row.date}:${i}`}>
              <th scope="row">
                {row.href ? (
                  <a href={row.href} target="_blank" rel="noopener noreferrer">
                    {row.label} ↗
                  </a>
                ) : (
                  row.label
                )}
              </th>
              <td className={layout.atomic}>{row.date ?? "Not supplied"}</td>
              {columns.map((label) => {
                const value = row.cells.find(
                  (cell) => cell.label === label,
                )?.value;
                return (
                  <td
                    key={label}
                    className={
                      value &&
                      /^\(?[+−-]?(?:[A-Z]{3}\s*)?[$€£¥]?\d[\d,.]*(?:%|\s[A-Z]{3})?\)?$/.test(
                        value,
                      )
                        ? layout.atomic
                        : undefined
                    }
                  >
                    {!value ? (
                      "Not supplied"
                    ) : value.length > 150 || label === "Source citation" ? (
                      <details className={s.cellDetails}>
                        <summary>
                          {label === "Source citation"
                            ? "View source citation"
                            : "Read full detail"}
                        </summary>
                        <p>{value}</p>
                      </details>
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
              {rows.some((row) => row.text) && (
                <td>
                  {row.text ? (
                    <details className={s.cellDetails}>
                      <summary>Read summary</summary>
                      <p>{row.text}</p>
                    </details>
                  ) : (
                    "Not supplied"
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
