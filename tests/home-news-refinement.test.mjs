import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadHomeNews } from "./helpers/home-news-ui.mjs";

const news = Array.from({ length: 9 }, (_, i) => ({
  symbol: `TEST${i}`, title: `Company update ${i}`, date: "2026-11-14",
  url: `https://example.com/${i}`,
}));
test("Home news shows four consistent rows and keeps later stories reachable", () => {
  for (const [page, from, to, previousDisabled, nextDisabled] of [[0,0,4,true,false],[1,4,8,false,false],[2,8,9,false,true],[99,8,9,false,true]]) {
    const html = renderToStaticMarkup(React.createElement(loadHomeNews(page), { headlines: news, prefix: "/preview" }));
    assert.equal((html.match(/<article/g) || []).length, to - from);
    assert.equal((html.match(/<time /g) || []).length, to - from);
    assert.match(html, new RegExp(`${from + 1}–${to} of 9`));
    for (let i = from; i < to; i++) {
      assert.match(html, new RegExp(`Company update ${i}`));
      assert.match(html, new RegExp(`/preview/research/TEST${i}`));
    }
    assert.equal(/<button[^>]*disabled=""[^>]*aria-label="Previous headlines"/.test(html), previousDisabled);
    assert.equal(/<button[^>]*disabled=""[^>]*aria-label="Next headlines"/.test(html), nextDisabled);
  }
});
test("Home removes the duplicate comparison banner and obsolete coverage section and link", () => {
  const home = fs.readFileSync("components/HomeWorkspace.tsx", "utf8");
  const briefing = fs.readFileSync("components/HomeDailyBriefing.tsx", "utf8");
  assert.doesNotMatch(home, /<ContributionCompare|Research coverage & data sources|<Coverage/);
  assert.doesNotMatch(briefing, /#home-coverage|Research coverage/);
  assert.match(fs.readFileSync("components/SupportingViews.tsx", "utf8"), /title="Compare companies"/);
});

test("Home news pager uses the clamped displayed page after data shrinks", () => {
  let page;
  const View = loadHomeNews(99, next => { page = next; });
  const tree = View({ headlines: news.slice(0, 5), prefix: "" });
  const all = [];
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    all.push(node); walk(node.props?.children);
  }
  walk(tree);
  const previous = all.find(node => node.props?.["aria-label"] === "Previous headlines");
  previous.props.onClick();
  assert.equal(page, 0);
  const next = all.find(node => node.props?.["aria-label"] === "Next headlines");
  assert.equal(next.props.disabled, true);
  const emptyHtml = renderToStaticMarkup(React.createElement(loadHomeNews(99), { headlines: [], prefix: "" }));
  assert.doesNotMatch(emptyHtml, /of 0|<article|<nav/);
});

test("contribution fit remains available in Compare after removing its Home banner", () => {
  const compare = fs.readFileSync("components/SupportingViews.tsx", "utf8");
  assert.match(compare, /<ContributionCompare/);
  assert.match(fs.readFileSync("components/ContributionCompare.tsx", "utf8"), /Compare a planned addition/);
});

test("Home news saves its clamped location so a later feed growth does not jump pages", () => {
  let page = 9;
  const effects = [];
  const View = loadHomeNews(page, update => { page = typeof update === "function" ? update(page) : update; }, effects);
  View({ headlines: news.slice(0, 5), prefix: "" });
  effects.forEach(effect => effect());
  assert.equal(page, 1);
});
