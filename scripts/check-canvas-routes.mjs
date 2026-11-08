const { chromium } = await import(
  process.env.AURYN_PLAYWRIGHT_PATH || "playwright"
);
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
execFileSync(
  process.execPath,
  ["--experimental-strip-types", "--test", "tests/home-workspace.test.mjs"],
  {
    env: {
      ...process.env,
      AURYN_HOME_NEWS_FIXTURE: "/tmp/auryn-populated-news.html",
    },
    stdio: "pipe",
  },
);
const browser = await chromium.launch({
  executablePath: process.env.AURYN_CHROMIUM_PATH,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--no-proxy-server"],
});
const report = [];
await fs.mkdir("/tmp/auryn-canvas", { recursive: true });
try {
  for (const width of process.env.AURYN_CANVAS_WIDTHS
    ? JSON.parse(process.env.AURYN_CANVAS_WIDTHS)
    : [1440, 390])
    for (const theme of ["light", "dark"])
      for (const route of process.env.AURYN_CANVAS_ROUTES
        ? JSON.parse(process.env.AURYN_CANVAS_ROUTES)
        : [
            "/",
            "/preview/overview",
            "/preview/watchlist",
            "/preview/portfolio",
            "/preview/research/MSFT",
            "/preview/research/MSFT?tab=Valuation",
            "/preview/research/MSFT?tab=Financials",
            "/preview/research/MSFT?tab=Technicals",
            "/preview/research/MSFT?tab=Analysts",
            "/preview/research/MSFT?tab=News",
            "/preview/research/MSFT?tab=Options",
            "/preview/research/MSFT?tab=Thesis",
            "/preview/research/MSFT?tab=Advanced",
          ]) {
        const page = await browser.newPage({
          viewport: { width, height: 1000 },
        });
        const errors = [];
        page.on("console", (m) => {
          if (m.type() === "error") errors.push(m.text());
        });
        page.on("pageerror", (e) => errors.push(e.message));
        await page.addInitScript((theme) => {
          localStorage.setItem("auryn-product-theme", theme);
          if (document.documentElement)
            document.documentElement.dataset.theme = theme;
        }, theme);
        const response = await page.goto("http://127.0.0.1:3010" + route, {
          timeout: 120000,
          waitUntil: "domcontentloaded",
        });
        await page.waitForLoadState("networkidle", { timeout: 60000 });
        await page.locator("main h1").first().waitFor({ timeout: 120000 });
        await page
          .locator('[aria-busy="true"]')
          .first()
          .waitFor({ state: "hidden", timeout: 60000 })
          .catch(() => {});
        await page
          .getByRole("status")
          .filter({
            hasText: /^(Loading…|Opening valuation…|Opening options…)$/,
          })
          .first()
          .waitFor({ state: "hidden", timeout: 60000 });
        await page.evaluate((theme) => {
          document.documentElement.dataset.theme = theme;
        }, theme);
        await page.evaluate(() => document.fonts.ready);
        if (route.includes("/research/") && !route.includes("?")) {
          await page
            .locator(".plot-section canvas")
            .first()
            .waitFor({ state: "visible", timeout: 60000 });
          await page
            .getByRole("button", { name: "Explore P3: Gradual" })
            .waitFor({ timeout: 60000 });
        }
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
        if (route === "/preview/overview") {
          const fixture = await fs.readFile(
            "/tmp/auryn-populated-news.html",
            "utf8",
          );
          await page.evaluate((html) => {
            const fixture = new DOMParser()
              .parseFromString(html, "text/html")
              .querySelector(".home-news-panel");
            document.querySelector(".home-news-panel").innerHTML =
              fixture.innerHTML;
          }, fixture);
          await page
            .locator(".home-more-updates summary")
            .evaluate((el) => el.click());
          if ((await page.locator(".home-news-title:visible").count()) !== 9)
            throw Error("Expanded news lost articles");
          const columns = await page
            .locator(".home-more-updates .home-news-list")
            .evaluate(
              (el) =>
                getComputedStyle(el).gridTemplateColumns.split(" ").length,
            );
          if (width === 1440 && columns !== 2)
            throw Error("Expanded news must retain two columns");
        }
        if (width === 390 && route.includes("/research/")) {
          const active = page
            .getByRole("navigation", { name: "Research sections" })
            .locator('[aria-current="page"]');
          const visible = await active.evaluate((el) => {
            const frame = el.parentElement.getBoundingClientRect(),
              item = el.getBoundingClientRect();
            return item.left >= frame.left - 1 && item.right <= frame.right + 1;
          });
          if (!visible)
            throw Error("Active mobile research tab is offscreen: " + route);
        }
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          heading: document.querySelector("main h1")?.textContent,
          tab: document
            .querySelector("[data-research-section]")
            ?.getAttribute("data-research-section"),
          text: document.querySelector("main")?.innerText.slice(0, 180),
        }));
        const name = route
          .replace("/preview/", "")
          .replaceAll("/", "-")
          .replace("?tab=", "-");
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: `/tmp/auryn-canvas/${name}-${width}-${theme}.png`,
          fullPage: true,
          caret: "initial",
        });
        if (response.status() !== 200 || result.overflow || errors.length)
          throw Error(
            JSON.stringify({
              route,
              width,
              theme,
              status: response.status(),
              ...result,
              errors,
            }),
          );
        report.push({
          route,
          width,
          theme,
          status: response.status(),
          ...result,
          errors,
        });
        console.log(JSON.stringify(report.at(-1)));
        if (
          route.includes("?tab=Financials") ||
          route.includes("?tab=Valuation") ||
          route.includes("?tab=Analysts") ||
          route.includes("?tab=News")
        ) {
          await page.locator("main details").evaluateAll((items) =>
            items.forEach((el) => {
              el.open = true;
            }),
          );
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              ),
          );
          if (
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 1,
            )
          )
            throw Error("Expanded details overflow: " + route);
          await page.screenshot({
            path: `/tmp/auryn-canvas/${name}-${width}-${theme}-expanded.png`,
            fullPage: true,
            caret: "initial",
          });
        }
        await page.close();
      }
} finally {
  await browser.close();
  await fs.mkdir(
    process.env.AURYN_CANVAS_REPORT_DIR ||
      "verification/cohesive-workspace-20261108",
    { recursive: true },
  );
  await fs.writeFile(
    (process.env.AURYN_CANVAS_REPORT_DIR ||
      "verification/cohesive-workspace-20261108") + "/routes.json",
    JSON.stringify(report, null, 2),
  );
}
