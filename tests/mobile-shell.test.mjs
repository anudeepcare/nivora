import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("browser mobile shell uses the final glass chrome layer", () => {
  const layout = fs.readFileSync("app/layout.tsx", "utf8");
  const css = fs.readFileSync("app/mobile-final.css", "utf8");
  const shell = fs.readFileSync("components/Shell.tsx", "utf8");
  const pwa = fs.readFileSync("components/Pwa.tsx", "utf8");
  const home = fs.readFileSync("components/HomeBriefing.tsx", "utf8");
  assert.match(layout, /import "\.\/mobile-final\.css"/);
  assert.match(css, /\.auryn-experience \.topbar[\s\S]*border-bottom:\s*0/);
  assert.match(css, /\.auryn-experience \.topbar[\s\S]*box-shadow:\s*none/);
  assert.match(css, /backdrop-filter:\s*blur\(22px\)/);
  assert.match(css, /mobile-dock/);
  assert.match(shell, /className="topbar"/);
  assert.match(pwa, /registration\.update\(\)/);
  assert.match(home, /home-command-bar/);
  assert.match(home, /Business → Value → Risk → Pace/);
});
