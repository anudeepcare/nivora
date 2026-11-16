"use client";
import type { ReactNode } from "react";
import type { Research } from "@/lib/types";
import { dateLabel } from "@/lib/format";
import { earningsCalendar } from "@/lib/earnings-calendar";
import s from "./CompanyUpdates.module.css";
import DetailDialog from "./DetailDialog";

import { NewsAndFilings } from "./ResearchEvidence";
export default function CompanyUpdates({
  research: r,
  preview = false,
  children,
  onOwnership,
}: {
  research: Research;
  preview?: boolean;
  children?: ReactNode;
  onOwnership?: () => void;
}) {
  const calendar = earningsCalendar(
    r,
    preview ? Date.parse(r.retrievedAt) : Date.now(),
  );
  const next = calendar.next;
  return (
    <NewsAndFilings research={r}>
      {children}
      <section className={s.events}>
        <header className="section-head">
          <div>
            <h2>Events & reported transactions</h2>
          </div>
        </header>
        <div className={s.eventLayout}>
          <div className={s.next}>
            <h3>Next scheduled earnings</h3>
            <p className="context-note">
              {next ? dateLabel(next.date) : calendar.status}
            </p>
            {next?.estimate != null && (
              <p>
                EPS estimate {next.estimate.toFixed(2)}
                <small className="muted">
                  {" "}
                  · Estimate currency and accounting basis not supplied
                </small>
              </p>
            )}
          </div>
          <div className={s.transactions}>
            <h3>
              {onOwnership ? "Reported activity" : "Reported transactions"}
            </h3>
            <DetailDialog
              title="Reported transactions"
              trigger={
                r.evidence?.insiders?.length
                  ? `${r.evidence.insiders.length} supplied transactions`
                  : "Transaction availability"
              }
            >
              <div className={s.transactions}>
                {r.evidence?.insiders?.length ? (
                  r.evidence.insiders.map((item, i) => (
                    <div className="stat-pair" key={i}>
                      <span>
                        {item.name}
                        <small className="muted">
                          {" "}
                          · {dateLabel(item.date)} ·{" "}
                          {item.code === "S"
                            ? "Sale"
                            : item.code === "P"
                              ? "Purchase"
                              : `Code ${item.code}`}
                        </small>
                      </span>
                      <strong>
                        {item.change == null
                          ? "Quantity not supplied"
                          : Math.abs(item.change).toLocaleString()}{" "}
                        {item.change != null ? "shares" : ""}
                      </strong>
                    </div>
                  ))
                ) : (
                  <p className="context-note">
                    No transaction records supplied.
                  </p>
                )}
              </div>
            </DetailDialog>
            {onOwnership && (
              <button
                type="button"
                className="text-button"
                onClick={onOwnership}
              >
                Ownership context →
              </button>
            )}
            <DetailDialog
              title="About reported activity"
              trigger="About reported activity"
            >
              <p>
                Sales can reflect tax, diversification or trading plans. Roles,
                transaction codes and filing dates need verification; this
                snapshot does not establish that every named person is a company
                insider.
              </p>
            </DetailDialog>
          </div>
        </div>
      </section>
    </NewsAndFilings>
  );
}
