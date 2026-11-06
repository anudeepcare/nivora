// Preview-only UI interactions; never submits account, billing, portfolio or support writes.
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
const { chromium } = await import(
  process.env.AURYN_PLAYWRIGHT_PATH || "playwright"
);
const base = process.env.AURYN_TEST_URL || "http://127.0.0.1:3033";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3033",
  ],
  { env: { ...process.env, AURYN_ENABLE_PREVIEW: "true" }, stdio: "ignore" },
);
const results = [];
let browser;
try {
  for (let i = 0; i < 120; i++) {
    try {
      await fetch(base);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  browser = await chromium.launch({
    executablePath: process.env.AURYN_CHROMIUM_PATH,
    args: ["--no-sandbox"],
  });
  for (const width of [1440, 402]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.setDefaultTimeout(5000);
    const check = async (name, fn) => {
      try {
        await fn();
        results.push({ width, name, passed: true });
      } catch (e) {
        results.push({ width, name, passed: false, error: String(e.message) });
      }
    };
    await page.goto(base + "/preview/portfolio", { waitUntil: "networkidle" });
    for (const label of ["Allocation", "Risk & events", "Holdings"])
      await check("Portfolio " + label, async () => {
        await page.getByRole("button", { name: label, exact: true }).click();
        await page.waitForTimeout(100);
        if ((await page.locator(".portfolio-page").count()) !== 1)
          throw Error("Portfolio missing");
      });
    await check("Position editor opens and closes", async () => {
      await page
        .getByRole("button", { name: "Add position", exact: true })
        .click();
      await page.getByRole("dialog").waitFor();
      await page.getByRole("button", { name: "Close position editor" }).click();
      if (await page.getByRole("dialog").isVisible())
        throw Error("Editor stayed open");
    });
    await check(
      "Margin and managed balance editor exposes readable fields",
      async () => {
        await page
          .getByRole("button", { name: "Edit margin & managed balance" })
          .click();
        if ((await page.locator(".account-balance-form input").count()) < 2)
          throw Error("Balance inputs missing");
        await page
          .locator(".account-balance-form")
          .getByRole("button", { name: "Cancel", exact: true })
          .click();
      },
    );
    await page.goto(base + "/preview/settings", { waitUntil: "networkidle" });
    for (const label of [
      "Research preferences",
      "Account & security",
      "Display & reading",
    ])
      await check("Settings " + label, async () => {
        await page
          .locator(".settings-studio-nav")
          .getByRole("button", { name: label, exact: true })
          .click();
        if ((await page.locator(".settings-studio-content").innerText()) === "")
          throw Error("Settings empty");
      });
    await check("Settings sheet opens and closes", async () => {
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page.getByRole("dialog").waitFor();
      await page
        .getByRole("button", { name: "Close settings", exact: true })
        .click();
    });
    await check("Global search opens and closes", async () => {
      await page
        .getByRole("button", { name: "Search companies and crypto" })
        .click();
      await page.getByRole("dialog").waitFor();
      await page.keyboard.press("Escape");
    });
    await page.goto(base + "/preview/watchlist", { waitUntil: "networkidle" });
    await check(
      "Watchlist filter retains a readable company result",
      async () => {
        const input = page.locator(".watchlist-toolbar input");
        await input.fill("NVDA");
        await page.waitForTimeout(100);
        if (
          !(await page.locator(".watchlist-page").innerText()).includes("NVDA")
        )
          throw Error("Expected company result missing");
        await input.fill("");
      },
    );
    await page.goto(base + "/preview/research/MSFT", {
      waitUntil: "networkidle",
    });
    await page.getByRole("tab", { name: "Options", exact: true }).click();
    await page.waitForFunction(
      () =>
        !document
          .querySelector("#research-content")
          ?.textContent?.includes("Opening options"),
    );
    await check("Options education works without a live chain", async () => {
      await page
        .locator(".options-nav")
        .getByRole("button", { name: "Understand options", exact: true })
        .click();
      if (
        !(await page.locator("#research-content").innerText()).includes("Delta")
      )
        throw Error("Options definitions missing");
    });
    for (const label of ["Plans & billing", "Alerts", "Help & support"]) {
      await page.goto(base + "/preview/settings", { waitUntil: "networkidle" });
      await check("Settings navigation " + label, async () => {
        await page
          .locator(".settings-studio-nav")
          .getByRole("link", { name: label, exact: true })
          .click();
        await page.waitForLoadState("networkidle");
        if (!(await page.locator("h1").count()))
          throw Error("Destination heading missing");
      });
    }
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
await fs.writeFile(
  "verification/approved-experience-interactions-final.json",
  JSON.stringify(results, null, 2),
);
console.log(
  JSON.stringify(
    { checks: results.length, failures: results.filter((r) => !r.passed) },
    null,
    2,
  ),
);
if (results.some((r) => !r.passed)) process.exitCode = 1;
