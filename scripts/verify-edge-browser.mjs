import fs from "node:fs/promises";
const { chromium } = await import(
  process.env.AURYN_PLAYWRIGHT_PATH || "playwright"
);
const base = process.env.AURYN_TEST_URL || "http://127.0.0.1:3031";
const { spawn } = await import("node:child_process");
const server =
  process.env.AURYN_BROWSER_START === "true"
    ? spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          "start",
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
  for (let i = 0; i < 100; i++) {
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
  for (const width of [1440, 402, 320])
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 1440 ? 1000 : 874 },
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
        "/login",
        "/login?mode=signup",
        "/preview/overview",
        "/preview/research/MSFT",
        "/preview/portfolio",
        "/preview/watchlist",
        "/contact",
        "/help",
        "/preview/settings",
        "/preview/plans",
      ]) {
        const before = errors.length;
        const response = await page.goto(base + route, {
          waitUntil: "networkidle",
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
          await page
            .getByRole("button", { name: "About AURYN Pace", exact: true })
            .click();
          const explanation = await page.getByRole("dialog").isVisible();
          await page
            .getByRole("button", { name: "Close explanation", exact: true })
            .click();
          report.push({
            width,
            theme,
            interaction: "Metric explanation open and close",
            passed: explanation,
            errors: explanation ? [] : ["Explanation not visible"],
          });
          await page.screenshot({
            path: `${screenshotDir}/${name}-viewport.png`,
            fullPage: false,
          });
          for (const label of [
            "Business",
            "Financials",
            "Value",
            "Technicals",
            "Analysts",
            "News",
            "Advanced",
            "Options",
          ]) {
            const tab = page.getByRole("tab", { name: label, exact: true });
            if (await tab.count()) {
              const priorErrors = errors.length;
              await tab.click();
              await page.waitForTimeout(200);
              const state = await page.evaluate(() => ({
                overflow: document.documentElement.scrollWidth > innerWidth + 1,
                invalid: /\bNaN\b|\bInfinity\b/.test(document.body.innerText),
              }));
              report.push({
                width,
                theme,
                tab: label,
                ...state,
                errors: errors.slice(priorErrors),
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
  "verification/edge-browser-report.json",
  JSON.stringify(report, null, 2),
);
const failures = report.filter(
  (r) => r.overflow || r.invalid || r.status >= 400 || r.errors?.length,
);
console.log(JSON.stringify({ checks: report.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
