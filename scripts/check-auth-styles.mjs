import fs from "node:fs/promises";
import assert from "node:assert/strict";
const { build } = await import(process.env.AURYN_ESBUILD_PATH || "esbuild");
const { chromium } = await import(
  process.env.AURYN_PLAYWRIGHT_PATH || "playwright"
);
const out = "/tmp/auryn-auth-styles";
await fs.mkdir(out, { recursive: true });
// Render the real login component with only its own CSS and root foundation.
// Product's route stylesheet deliberately is not loaded: auth lives above it.
await build({
  stdin: {
    contents: `import React from 'react';import{createRoot}from'react-dom/client';import{Login}from'./components/Session';import './app/core/foundation.css';import './app/core/preferences.css';import './app/core/primitives.css';createRoot(document.getElementById('root')).render(<Login initialError=""/>);`,
    resolveDir: process.cwd(),
    loader: "tsx",
  },
  bundle: true,
  external: ["/fonts/*"],
  outfile: out + "/app.js",
  jsx: "automatic",
  plugins: [
    {
      name: "auth-harness",
      setup(b) {
        b.onLoad({ filter: /\/Session\.tsx$/ }, async (a) => ({
          contents: (await fs.readFile(a.path, "utf8")) + "\nexport { Login };",
          loader: "tsx",
          resolveDir: process.cwd() + "/components",
        }));
        b.onResolve({ filter: /^next\/navigation$/ }, () => ({
          path: "navigation",
          namespace: "fixture",
        }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents:
            'export const useRouter=()=>({replace(){},refresh(){}});export const usePathname=()=>"/login";',
        }));
      },
    },
  ],
});
const browser = await chromium.launch({
  executablePath: process.env.AURYN_CHROMIUM_PATH,
  args: ["--no-sandbox"],
});
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.route("**/api/auth/providers", (r) =>
      r.fulfill({ json: { google: true, x: true } }),
    );
    await page.goto("about:blank");
    await page.setContent('<html><body><div id="root"></div></body></html>');
    await page.addStyleTag({ path: out + "/app.css" });
    await page.addScriptTag({ path: out + "/app.js" });
    const google = page.getByRole("button", { name: "Continue with Google" });
    await google.waitFor();
    const icon = await google.locator("svg").boundingBox();
    assert.ok(
      icon.width <= 24 && icon.height <= 24,
      `Cold-entry Google icon must remain compact, got ${JSON.stringify(icon)}`,
    );
    assert.equal(
      await google.evaluate((e) => getComputedStyle(e).display),
      "flex",
    );
    assert.equal(
      await page
        .locator(".mp-social-options")
        .evaluate((e) => getComputedStyle(e).display),
      "grid",
    );
    assert.equal(
      await page
        .locator(".mp-password-field > button")
        .evaluate((e) => getComputedStyle(e).position),
      "absolute",
    );
    assert.equal(
      await page
        .locator(".mp-form-submit")
        .evaluate((e) => Math.round(e.getBoundingClientRect().width)),
      await page
        .locator(".mp-auth-form")
        .evaluate((e) => Math.round(e.getBoundingClientRect().width)),
    );
    await page
      .getByRole("button", { name: "Create an account", exact: true })
      .click();
    await page.getByRole("heading", { name: "Start with clarity." }).waitFor();
    await page.getByRole("button", { name: "Back to sign in" }).click();
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await page.getByRole("heading", { name: "A fresh start." }).waitFor();
    assert.equal(
      await page.locator("body").evaluate((e) => e.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({ path: out + `/reset-${width}.png` });
    await page.close();
  }
  console.log(
    "Auth cold-entry styles and login/signup/reset mode checks passed at 390 and 1440px without Product CSS.",
  );
} finally {
  await browser.close();
}
