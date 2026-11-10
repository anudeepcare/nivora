"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { aurynDecision } from "@/lib/auryn-decision";
import { researchOutlook } from "@/lib/outlook";
import { scenarioLenses, type ScenarioLensModel } from "@/lib/scenario-lenses";
import { amount, dateLabel, percent } from "@/lib/format";
import s from "./ScenarioLenses.module.css";

type Decision = ReturnType<typeof aurynDecision>;
/** Cross-check of every qualifying bear/base/bull method on one price axis.
 * Reads existing engines only; it never feeds back into the decision or Pace. */
export default function ScenarioLenses({
  research: r,
  decision,
  hideSingle = false,
}: {
  research: Research;
  decision?: Decision;
  /** Skip the section when only one method qualifies and it is already shown above. */
  hideSingle?: boolean;
}) {
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  const d = useMemo(
    () => decision ?? aurynDecision(r, { now }),
    [decision, r, now],
  );
  const model = useMemo<ScenarioLensModel | null>(() => {
    if (r.company.assetType !== "stock") return null;
    // Same reference substitution as the selected valuation, so both agree.
    const input = d.reference
      ? {
          ...r,
          quote: {
            ...r.quote,
            price: d.reference.price,
            asOf: d.reference.asOf,
            currency: d.reference.currency,
            stale: false,
          },
        }
      : r;
    const ordinary = researchOutlook(input);
    const outlook = ordinary.available
      ? ordinary
      : d.valuation
        ? null
        : researchOutlook(input, { priceAnchored: true });
    if (outlook?.available)
      return {
        label:
          outlook.basis === "revenue"
            ? "AURYN revenue model"
            : outlook.multipleSource === "price-implied"
              ? "AURYN price-anchored earnings"
              : "AURYN earnings model",
        bear: outlook.cases[0].target,
        base: outlook.cases[1].target,
        bull: outlook.cases[2].target,
        end: outlook.end,
        asOf: outlook.asOf,
        note: outlook.caveat,
      };
    return d.valuation
      ? {
          label:
            d.valuation.basis === "cash-flow"
              ? "AURYN cash-flow model"
              : "AURYN earnings model",
          bear: d.valuation.bear,
          base: d.valuation.base,
          bull: d.valuation.bull,
          end: d.valuation.end,
          note: d.valuation.assumptions,
        }
      : null;
  }, [r, d]);
  const view = useMemo(
    () => scenarioLenses(r, { model, now }),
    [r, model, now],
  );
  if (!view.available) return null;
  if (hideSingle && view.lenses.length < 2) return null;
  const { currency, reference, lenses, primary } = view;
  const prices = [
    reference.price,
    ...lenses.flatMap((x) =>
      [x.bear, x.base, x.bull].filter((v): v is number => v != null),
    ),
  ];
  const low = Math.min(...prices),
    high = Math.max(...prices);
  const at = (price: number) => 2 + (96 * (price - low)) / (high - low || 1);
  const money = (v: number | null) =>
    v == null ? "—" : amount(v, currency, v >= 1000);
  const gap = (v: number) => percent((v / reference.price - 1) * 100, true);
  const positionText =
    view.position.state === "inside"
      ? `${view.position.percent.toFixed(0)}% of the way from bear to bull`
      : view.position.state === "below-bear"
        ? "Below the bear case"
        : view.position.state === "above-bull"
          ? "Above the bull case"
          : "No bear/bull range";
  return (
    <section
      className={s.root}
      aria-label="Bear, base and bull across methods"
      data-agreement={view.agreement.level}
    >
      <header className={s.heading}>
        <div>
          <span className={s.eyebrow}>Scenario cross-check</span>
          <h3>Bear, base &amp; bull across methods</h3>
        </div>
        <p>
          {lenses.length} method{lenses.length === 1 ? "" : "s"} · reference{" "}
          {money(reference.price)} · {dateLabel(reference.asOf)}
        </p>
      </header>
      <dl className={s.read}>
        <div data-tone={view.agreement.level}>
          <dt>Method agreement</dt>
          <dd>{view.agreement.label}</dd>
          <small>{view.agreement.detail}</small>
        </div>
        <div>
          <dt>Bull and bear gaps</dt>
          <dd>
            {view.asymmetry ? (
              <>
                <span data-case="bull">
                  Bull {percent(view.asymmetry.upside, true)}
                </span>
                {" · "}
                <span data-case="bear">
                  Bear {percent(-view.asymmetry.downside, true)}
                </span>
              </>
            ) : (
              "—"
            )}
          </dd>
          <small>
            {view.asymmetry?.ratio != null
              ? `${primary.label}: the bull gap is ${view.asymmetry.ratio.toFixed(1)}× the bear gap. A ratio is not a probability.`
              : view.asymmetry
                ? `${primary.label}: the current price sits outside its bear–bull range.`
                : `${primary.label} supplies no bear/bull range.`}
          </small>
        </div>
        <div>
          <dt>Where the price sits</dt>
          <dd>{positionText}</dd>
          <small>
            Within the {primary.label} range · {primary.horizon}.
          </small>
        </div>
      </dl>
      <div
        className={s.plot}
        role="img"
        aria-label={`Scenario ranges by method. Current ${money(reference.price)}. ${lenses
          .map(
            (x) =>
              `${x.label}: bear ${money(x.bear)}, base ${money(x.base)}, bull ${money(x.bull)}`,
          )
          .join(". ")}.`}
      >
        {lenses.map((x) => (
          <div className={s.row} key={x.id} data-primary={x === primary}>
            <div className={s.label}>
              <strong>{x.label}</strong>
              <small>{x.horizon}</small>
            </div>
            <div className={s.track}>
              <i
                className={s.now}
                style={{ left: `${at(reference.price)}%` }}
              />
              {x.bear != null && x.bull != null && (
                <i
                  className={s.range}
                  style={{
                    left: `${at(x.bear)}%`,
                    width: `${Math.max(0.5, at(x.bull) - at(x.bear))}%`,
                  }}
                />
              )}
              {x.bear != null && (
                <i
                  className={s.dot}
                  data-case="bear"
                  style={{ left: `${at(x.bear)}%` }}
                />
              )}
              {x.bull != null && (
                <i
                  className={s.dot}
                  data-case="bull"
                  style={{ left: `${at(x.bull)}%` }}
                />
              )}
              <i
                className={s.dot}
                data-case="base"
                data-neutral={x.neutralBase}
                style={{ left: `${at(x.base)}%` }}
              />
            </div>
            <div className={s.values}>
              <span data-case="bear">
                {money(x.bear)}
                {x.bear != null && <small>{gap(x.bear)}</small>}
              </span>
              <span data-case="base">
                {money(x.base)}
                <small>{x.neutralBase ? "= price" : gap(x.base)}</small>
              </span>
              <span data-case="bull">
                {money(x.bull)}
                {x.bull != null && <small>{gap(x.bull)}</small>}
              </span>
            </div>
          </div>
        ))}
        <p className={s.axis}>
          <span>{money(low)}</span>
          <span>
            <i className={s.nowKey} /> Current {money(reference.price)}
          </span>
          <span>{money(high)}</span>
        </p>
      </div>
      <details className={s.basis}>
        <summary>How each method works &amp; its limits</summary>
        <ul>
          {lenses.map((x) => (
            <li key={x.id}>
              <strong>{x.label}</strong>
              {x.asOf ? ` · data through ${dateLabel(x.asOf)}` : ""}. {x.note}
            </li>
          ))}
        </ul>
        <p>{view.caveat}</p>
      </details>
    </section>
  );
}
