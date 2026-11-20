import { researchLenses } from "../lib/reference-navigation.ts";
import fs from "node:fs/promises";
const { chromium } = await import(
  process.env.AURYN_PLAYWRIGHT_PATH || "playwright"
);
const base = process.env.AURYN_TEST_URL || "http://127.0.0.1:3031";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) {
  throw new Error(
    "This fixture browser audit is loopback-only. Do not point it at a deployment.",
  );
}
const { spawn } = await import("node:child_process");
const server =
  process.env.AURYN_BROWSER_START === "true"
    ? spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          "dev",
          "--hostname",
          "127.0.0.1",
          "--port",
          "3031",
        ],
        {
          env: { ...process.env, AURYN_ENABLE_PREVIEW: "true" },
          stdio: "ignore",
        },
      )
    : null;
if (server) {
  let ready = false;
  for (let i = 0; i < 200; i++) {
    try {
      await fetch(base);
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  if (!ready) {
    server.kill();
    throw Error("Preview server did not start.");
  }
}
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.AURYN_CHROMIUM_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const screenshotDir =
  process.env.AURYN_SCREENSHOT_DIR || "/tmp/auryn-edge-browser";
const report = [];
await fs.mkdir(screenshotDir, { recursive: true });
try {
  for (const width of [1440, 1180, 860, 402, 320])
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: {
          width,
          height: width === 1440 ? 900 : width >= 768 ? 757 : 844,
        },
        deviceScaleFactor: 1,
        isMobile: width < 500,
        hasTouch: width < 500,
      });
      await context.addInitScript(
        ({ theme, mobile }) => {
          localStorage.setItem("auryn-product-theme", theme);
          if (mobile)
            Object.defineProperty(navigator, "standalone", {
              value: true,
              configurable: true,
            });
        },
        { theme, mobile: width < 500 },
      );
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      for (const route of [
        "/",
        "/sample",
        "/login",
        "/login?mode=signup",
        "/about",
        "/track-record",
        "/pace",
        "/portfolio-check",
        "/pricing",
        "/methodology",
        "/terms",
        "/privacy",
        "/reliability",
        "/risk",
        "/changelog",
        "/preview/overview",
        "/preview/research",
        "/preview/options",
        "/preview/discover",
        "/preview/compare",
        "/preview/alerts",
        "/preview/owner",
        "/preview/monthly-plan",
        "/preview/trading",
        "/preview/research-lab",
        "/preview/research/MSFT",
        "/preview/portfolio",
        "/preview/watchlist",
        "/reset-password",
        "/contact",
        "/help",
        "/preview/settings",
        "/preview/plans",
      ]) {
        const before = errors.length;
        const response = await page.goto(base + route, {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        });
        await page.waitForTimeout(150);
        const audit = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          invalid: /\bNaN\b|\bInfinity\b/.test(document.body.innerText),
          edge: !!document.querySelector(".edge-overview"),
          headerTop:
            document.querySelector(".topbar")?.getBoundingClientRect().top ??
            null,
        }));
        const name = `${width}-${theme}-${route.replace(/[^a-zA-Z0-9]/g, "_") || "landing"}`;
        await page.screenshot({
          path: `${screenshotDir}/${name}.png`,
          fullPage: true,
        });
        report.push({
          width,
          theme,
          route,
          status: response?.status(),
          ...audit,
          errors: errors.slice(before),
        });
        if (route === "/login") {
          const submit = page.locator('form button[type="submit"]');
          await submit.waitFor({ state: "visible", timeout: 15000 });
          const fit = await submit.evaluate((element) => {
            const viewport = window.visualViewport?.height ?? innerHeight;
            const box = element.getBoundingClientRect();
            return box.top >= 0 && box.bottom <= viewport;
          });
          report.push({
            width,
            theme,
            route,
            interaction: "Sign-in submit visible without scrolling",
            passed: fit,
            errors: fit ? [] : ["Sign-in submit is below the fold"],
          });
        }
        if (
          route === "/contact" &&
          !(await page
            .getByRole("heading", { name: "How can we help?" })
            .count())
        )
          report.push({
            width,
            theme,
            route,
            errors: ["Public contact form is not reachable"],
          });
        if (route === "/preview/research/MSFT") {
          const nav = page.getByRole("navigation", {
            name: "Research sections",
          });
          await nav.waitFor({ state: "visible", timeout: 15000 });
          try {
            await page
              .getByRole("button", {
                name: "About this Pace reading",
                exact: true,
              })
              .click({ timeout: 8000 });
            const help = page.getByRole("dialog", {
              name: "this Pace reading",
              exact: true,
            });
            await help.waitFor({ state: "visible", timeout: 5000 });
            await help
              .getByRole("button", { name: "Close explanation", exact: true })
              .click();
            await help.waitFor({ state: "hidden", timeout: 5000 });
            report.push({
              width,
              theme,
              route,
              interaction: "Pace explanation open and close",
              passed: true,
            });
          } catch (error) {
            report.push({
              width,
              theme,
              route,
              interaction: "Pace explanation open and close",
              passed: false,
              errors: [String(error)],
            });
          }
          for (const { label, sections } of researchLenses) {
            const region =
              sections[0] === "Snapshot"
                ? "research-overview"
                : "research-content";
            const target = nav.getByRole("button", {
              name: label,
              exact: true,
            });
            const priorErrors = errors.length;
            try {
              await target.click({ timeout: 8000 });
              await page
                .locator("#" + region)
                .waitFor({ state: "visible", timeout: 15000 });
              const selected =
                (await target.getAttribute("aria-current")) === "page";
              const state = await page.evaluate(() => ({
                overflow: document.documentElement.scrollWidth > innerWidth + 1,
                invalid: /\bNaN\b|\bInfinity\b/.test(document.body.innerText),
              }));
              report.push({
                width,
                theme,
                route,
                tab: label,
                ...state,
                passed: selected,
                errors: errors.slice(priorErrors),
              });
            } catch (error) {
              report.push({
                width,
                theme,
                route,
                tab: label,
                passed: false,
                errors: [String(error)],
              });
            }
          }
        }
      }
      await context.close();
    }
} finally {
  await browser.close();
  server?.kill();
}
await fs.writeFile(
  screenshotDir + "/approved-experience-browser-report.json",
  JSON.stringify(report, null, 2),
);
const failures = report.filter(
  (r) =>
    r.overflow ||
    r.invalid ||
    r.passed === false ||
    r.status >= 400 ||
    r.errors?.length,
);
console.log(JSON.stringify({ checks: report.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
