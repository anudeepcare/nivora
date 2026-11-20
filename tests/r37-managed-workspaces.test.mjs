import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (file) => fs.readFileSync(`components/${file}`, "utf8");
test("Watchlist combines count, follow and alert in a single header and shares one results plane", () => {
  const source = read("WatchlistPage.tsx");
  assert.match(source, /title="Watchlist"/);
  assert.doesNotMatch(source, /className="watch-summary"/);
  assert.match(
    source,
    /className=\{decisionStyles\.watchActions\}[\s\S]*?Follow company[\s\S]*?Create a price alert/,
  );
  assert.match(
    source,
    /data-plaid-block="watch-queue"[\s\S]*?<DecisionAttention/,
  );
});
test("admin reading surfaces remove nested decorative chrome while retaining distinct actions", () => {
  assert.match(
    read("OwnerAccess.module.css"),
    /admin-section-nav\)[\s\S]*?border: 0/,
  );
  assert.match(
    read("OwnerHandbook.module.css"),
    /\.root\.root \.reader\s*\{[^}]*border: 0/,
  );
  assert.match(read("SupportInbox.module.css"), /\.inbox\.inbox \.delivery/);
  const inbox = read("SupportInbox.tsx");
  assert.match(inbox, /Refresh inbox/);
  assert.match(inbox, /Retry pending emails/);
});
