import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(`components/${file}`, "utf8");
test("Pace methods and Option positioning evidence remain native disclosures", () => {
  for (const [file, title] of [
    ["AccumulationDesk.tsx", "See the rules and price assumptions"],
    ["PaceEvidenceJourney.tsx", "What would change the reading?"],
    ["PaceHistoryInsights.tsx", "Confirmed vs temporary readings"],
    ["SentiSensePanels.tsx", "Detailed positioning observations"],
  ]) {
    const source = read(file);
    assert.ok(source.includes("data-research-disclosure"), file);
    const details =
      source.match(
        /<details[^>]*data-research-disclosure[^>]*>\s*<summary>[\s\S]*?<\/summary>/g,
      ) ?? [];
    assert.ok(
      details.some((item) => item.includes(title)),
      title,
    );
  }
  assert.match(
    read("SentiSensePanels.tsx"),
    /data-research-disclosure=\{dataset === "options" \? "" : undefined\}/,
  );
});

test("quiet disclosure summaries fit content, stay keyboard-visible, and keep 44px targets", () => {
  assert.ok(existsSync("components/ResearchEvidenceDisclosures.css"));
  const css = read("ResearchEvidenceDisclosures.css");
  assert.match(
    css,
    /details\[data-research-disclosure\]:not\(\[open\]\)[^{]*\{[^}]*inline-size: fit-content/,
  );
  assert.match(css, /> summary\s*\{[^}]*min-block-size: 44px/);
  assert.match(css, /> summary:focus-visible\s*\{[^}]*outline: 2px solid/);
  assert.match(
    css,
    /details\[data-research-disclosure\]\[open\][^{]*\{[^}]*inline-size: 100%/,
  );
});

test("Options controls and guidance share a compact toolbar without removing selections", () => {
  const source = read("OptionsDesk.tsx");
  const toolbar =
    source
      .split("<header className={deskStyles.commandBar}>")[1]
      ?.split("</header>")[0] ?? "";
  assert.match(toolbar, /aria-label="Expiration date"/);
  assert.match(toolbar, /aria-label="Options sections"/);
  assert.match(toolbar, /aria-label="Advanced options tools"/);
  assert.doesNotMatch(toolbar, /Choose an expiration to explore/);
  assert.doesNotMatch(source, /<strong>Options, in context<\/strong>/);
});

test("Pace historical evidence aligns to the chart rail and its tables remain keyboard-scrollable", () => {
  const css = read("PaceHistoryInsights.module.css");
  assert.match(css, /\.history\s*\{[^}]*padding-inline: 0/);
  assert.match(css, /\.controls select\s*\{[^}]*min-height: 44px/);
  assert.equal(
    (
      read("PaceHistoryInsights.tsx").match(
        /className=\{styles.scroll\}\s+tabIndex=\{0\}/g,
      ) ?? []
    ).length,
    2,
  );
});
