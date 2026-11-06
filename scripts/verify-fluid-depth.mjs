// Read-only UI exercise on the isolated illustrative preview. No account writes.
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
const { chromium } = await import(
  process.env.AURYN_PLAYWRIGHT_PATH || "playwright"
);
const base = "http://127.0.0.1:3036",
  results = [];
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3036",
  ],
  { env: { ...process.env, AURYN_ENABLE_PREVIEW: "true" }, stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 150; i++) {
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
  for (const width of [1440, 402, 320])
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width, height: 874 },
        isMobile: width < 500,
        hasTouch: width < 500,
      });
      await context.addInitScript(
        ({ theme, mobile }) => {
          localStorage.setItem("auryn-product-theme", theme);
          if (mobile)
            Object.defineProperty(navigator, "standalone", { value: true });
        },
        { theme, mobile: width < 500 },
      );
      const page = await context.newPage();
      page.setDefaultTimeout(7000);
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const check = async (name, fn) => {
        try {
          await fn();
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          );
          if (overflow) throw Error("Horizontal overflow");
          if (errors.length) throw Error(errors.splice(0).join("; "));
          results.push({ width, theme, name, passed: true });
        } catch (e) {
          results.push({ width, theme, name, passed: false, error: e.message });
        }
      };
      await page.goto(base + "/login", { waitUntil: "networkidle" });
      await check(
        "Illustrative preview maintains readable contrast in either theme",
        async () => {
          const contrast = await page
            .locator(".panorama-verdict")
            .evaluate((el) => {
              const rgb = (s) =>
                s
                  .match(/[\d.]+/g)
                  .slice(0, 3)
                  .map(Number);
              const lum = (c) =>
                c
                  .map((x) => {
                    x /= 255;
                    return x <= 0.04045
                      ? x / 12.92
                      : ((x + 0.055) / 1.055) ** 2.4;
                  })
                  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
              const h = el.querySelector("h2");
              const f = lum(rgb(getComputedStyle(h).color)),
                b = lum(rgb(getComputedStyle(el).backgroundColor));
              return (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05);
            });
          if (contrast < 4.5)
            throw Error("Preview text contrast " + contrast.toFixed(2));
        },
      );
      await page.goto(base + "/preview/research/MSFT", {
        waitUntil: "networkidle",
      });
      await check(
        "Operating metric help opens with a readable explanation",
        async () => {
          await page
            .locator(".overview-metric-rows")
            .first()
            .getByRole("button")
            .first()
            .click();
          await page.getByRole("dialog").waitFor();
          await page
            .getByRole("button", { name: "Close explanation", exact: true })
            .click();
        },
      );
      await check("Long company identity remains within viewport", async () => {
        await page
          .locator(".security-head h1")
          .evaluate(
            (el) =>
              (el.textContent =
                "Atlas International Enterprise Technology Systems Class A Ordinary Shares"),
          );
      });
      await page.getByRole("tab", { name: "Financials", exact: true }).click();
      for (const label of ["Annual", "TTM", "Quarterly"])
        await check("Financial period " + label, async () => {
          const button = page
            .getByRole("group", { name: "Financial period" })
            .getByRole("button", { name: label, exact: true });
          if (await button.count()) await button.click();
          else
            await page
              .locator('[aria-label="Financial period"]')
              .getByRole("button", { name: label, exact: true })
              .click();
        });
      await page.getByRole("tab", { name: "Advanced", exact: true }).click();
      await page.locator(".professional-tabs").waitFor();
      for (const label of [
        "Risk & conditions",
        "Position design",
        "Expectations",
        "Market context",
        "Historical lens",
      ])
        await check("Advanced " + label, async () => {
          await page
            .locator(".professional-tabs")
            .getByRole("button", { name: label, exact: true })
            .click();
          await page.waitForFunction(
            () =>
              !/Opening position workbench|Opening valuation workbench|Opening market workbench|Opening historical workbench/.test(
                document.querySelector("#research-content")?.textContent || "",
              ),
          );
        });
      await page.getByRole("tab", { name: "Options", exact: true }).click();
      await page.locator(".options-nav").waitFor();
      const names = await page.locator(".options-nav button").allTextContents();
      for (const name of names)
        await check("Options " + name.trim(), async () => {
          await page
            .locator(".options-nav")
            .getByRole("button", { name: name.trim(), exact: true })
            .click();
        });
      for (const route of [
        "/help",
        "/contact",
        "/terms",
        "/privacy",
        "/risk",
        "/methodology",
        "/reliability",
        "/preview/alerts",
      ])
        await check("Supporting route " + route, async () => {
          const response = await page.goto(base + route, {
            waitUntil: "networkidle",
          });
          if (response.status() !== 200)
            throw Error("HTTP " + response.status());
        });
      await context.close();
    }
} finally {
  await browser?.close();
  server.kill();
}
const failed = results.filter((r) => !r.passed);
await fs.writeFile(
  "verification/fluid-depth-browser.json",
  JSON.stringify(results, null, 2),
);
console.log(
  JSON.stringify({ checks: results.length, failures: failed }, null, 2),
);
if (failed.length) process.exitCode = 1;
