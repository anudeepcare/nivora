import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { NavigationMemory } from "../lib/navigation.ts";

const navigation = fs.existsSync("lib/settings-navigation.ts")
  ? await import("../lib/settings-navigation.ts")
  : {};
const empty = () => null;
function load(file, name, bindings) {
  bindings = { SUPPORT_EMAIL: "support@auryninvest.com", PrivacyChoices: () => null, useAccess: () => ({access:{capabilities:{paperTrading:false}}}), ...bindings };
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const node = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
  );
  const code = ts.transpileModule(
    node.getText(ast).replace("export default ", "").replace("export ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  return new Function(
    "React",
    ...Object.keys(bindings),
    code + `;return ${name};`,
  )(React, ...Object.values(bindings));
}
function nodes(node, predicate, visible = false) {
  if (!node || typeof node !== "object" || (visible && node.props?.hidden))
    return [];
  return [
    ...(predicate(node) ? [node] : []),
    ...React.Children.toArray(node.props?.children).flatMap((child) =>
      nodes(child, predicate, visible),
    ),
  ];
}
function shell(
  page,
  location = {
    pathname: "/research/MSFT",
    search: "?tab=financials&q=cloud",
    hash: "#income",
  },
) {
  const pushes = [];
  const Shell = load("components/Shell.tsx", "Shell", {
    usePathname: () => location.pathname,
    useRouter: () => ({ push: (url) => pushes.push(url) }),
    useProduct: () => ({
      theme: "light",
      workspace: { email: "person@example.com" },
    }),
    useRef: (value) => ({ current: value }),
    useLayoutEffect: empty,
    useEffect: empty,
    NavigationMemory,
    ...navigation,
    primary: [],
    window: { location },
    Link: "Link",
    AccessNotice: empty,
    ProductFooter: empty,
    Settings: empty,
    Search: empty,
    SearchIcon: empty,
    Sun: empty,
    Moon: empty,
    X: empty,
    Bell: empty,
    LayoutGrid: empty,
    Compass: empty,
    FlaskConical: empty,
    Scale: empty,
    HelpCircle: empty,
    ArrowUpRight: empty,
    ChartNoAxesCombined: empty,
    SettingsSheet: "SettingsSheet",
  });
  return { tree: Shell({ page, children: "content" }), pushes };
}
test("avatar enters the same settings route and preserves the full company context for Back", () => {
  const { tree, pushes } = shell("research");
  const avatar = nodes(
    tree,
    (node) => node.props?.["aria-label"] === "Account settings",
  )[0];
  assert.equal(
    avatar.type,
    "Link",
    "Account settings must navigate, not open a second surface",
  );
  assert.equal(avatar.props.href, "/settings");
  let prevented = false;
  avatar.props.onNavigate({
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.deepEqual(pushes, [
    "/settings?from=%2Fresearch%2FMSFT%3Ftab%3Dfinancials%26q%3Dcloud%23income",
  ]);
  assert.equal(nodes(tree, (n) => n.type === "SettingsSheet").length, 0);
});
test("Explore has a distinct tools dialog and omits the destination already open", () => {
  for (const page of [
    "settings",
    "discover",
    "compare",
    "research-lab",
    "trading",
    "help",
  ]) {
    const { tree } = shell(page, {
      pathname: `/${page}`,
      search: "",
      hash: "",
    });
    const dialog = nodes(
      tree,
      (n) => n.type === "dialog" && n.props["aria-label"] === "Explore tools",
    )[0];
    assert.ok(dialog, "Explore must clearly identify its tools surface");
    assert.equal(
      nodes(dialog, (n) => n.type === "Link" && n.props.href === `/${page}`)
        .length,
      0,
    );
    assert.ok(
      nodes(dialog, (n) => n.type === "Link" && n.props.href === "/compare")
        .length || page === "compare",
    );
  }
});
test("opening Settings again keeps the existing return context without stacking navigation", () => {
  const { tree, pushes } = shell("settings", {
    pathname: "/settings",
    search: "?from=%2Fwatchlist%3Fq%3Dchip",
    hash: "",
  });
  const avatar = nodes(
    tree,
    (node) => node.props?.["aria-label"] === "Account settings",
  )[0];
  avatar.props.onNavigate({ preventDefault: empty });
  assert.deepEqual(pushes, []);
});
function settings(demo, overrides = {}) {
  const effects = [];
  const state = [];
  const View = load("components/SupportingViews.tsx", "Settings", {
    useProduct: () => ({ workspace: { email: "person@example.com" }, demo }),
    useAccess: () => ({ access: { owner: false, plan: "free" } }),
    useState: (value) => [value, (next) => state.push(next)],
    useEffect: (fn) => effects.push(fn),
    Link: "Link",
    PageHeading: empty,
    DisplayPreferences: empty,
    ResearchPreferenceControls: empty,
    ArrowUpRight: empty,
    ArrowLeft: empty,
    ChevronRight: empty,
    LogOut: empty,
    ShieldCheck: empty,
    Bell: empty,
    Layers3: empty,
    Scale: empty,
    ChartNoAxesCombined: empty,
    Notice: empty,
    ...navigation,
    ...overrides,
  });
  return { tree: View(), effects, state };
}
test("Sign out and Back are visible on first entering Settings without choosing Account", () => {
  const { tree } = settings({ routePrefix: "/preview" });
  const signout = nodes(
    tree,
    (n) =>
      n.type === "button" && n.props.className?.includes("settings-signout"),
    true,
  );
  assert.equal(
    signout.length,
    1,
    "Sign out must not live inside a hidden category",
  );
  assert.equal(
    signout[0].props.disabled,
    true,
    "Preview account writes stay disabled",
  );
  const back = nodes(
    tree,
    (n) =>
      n.type === "Link" && n.props["aria-label"] === "Back to previous screen",
    true,
  )[0];
  assert.ok(back, "A visible Back link is required");
  assert.equal(
    back.props.href,
    "/preview/overview",
    "Direct settings entry has an in-app fallback",
  );
});
test("settings return URL keeps ticker, query and hash but rejects external and nested settings targets", () => {
  assert.equal(typeof navigation.settingsReturnHref, "function");
  assert.equal(
    navigation.settingsReturnHref(
      "/research/MSFT?tab=financials&q=cloud#income",
      "",
    ),
    "/research/MSFT?tab=financials&q=cloud#income",
  );
  assert.equal(
    navigation.settingsReturnHref("/preview/watchlist?q=chip", "/preview"),
    "/preview/watchlist?q=chip",
  );
  for (const invalid of [
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/settings?from=/settings",
    "/login",
    "/api/account",
    "/preview/research/MSFT",
    null,
  ]) {
    assert.equal(
      navigation.settingsReturnHref(invalid, ""),
      "/overview",
      String(invalid),
    );
  }
});
test("the Settings Back link reads the preserved screen from the incoming URL", () => {
  const { effects, state } = settings(
    { routePrefix: "/preview" },
    {
      window: {
        location: {
          search:
            "?from=%2Fpreview%2Fresearch%2FMSFT%3Ftab%3Dfinancials%23income",
        },
      },
    },
  );
  effects[0]();
  assert.equal(state[0], "/preview/research/MSFT?tab=financials#income");
});
test("visible Sign out stays disabled in preview and reports real sign-out failures", async () => {
  let calls = 0;
  const signOutAndRedirect = async () => {
    calls++;
    throw new Error("Session could not be ended");
  };
  const preview = settings({ routePrefix: "/preview" }, { signOutAndRedirect });
  await nodes(
    preview.tree,
    (n) => n.type === "button" && n.props.className === "settings-signout",
  )[0].props.onClick();
  assert.equal(calls, 0);
  const live = settings(undefined, { signOutAndRedirect });
  await nodes(
    live.tree,
    (n) => n.type === "button" && n.props.className === "settings-signout",
  )[0].props.onClick();
  assert.equal(calls, 1);
  assert.deepEqual(live.state, [true, "", "Session could not be ended", false]);
});
test("Reduce motion exposes switch state with a single thumb", () => {
  let changed;
  const Display = load(
    "components/DisplayPreferences.tsx",
    "DisplayPreferences",
    {
      useProduct: () => ({
        themePreference: "light",
        textSize: "standard",
        reduceMotion: false,
        setReduceMotion: (value) => {
          changed = value;
        },
      }),
      AppearanceControls: empty,
      ResearchModeSwitch: empty,
    },
  );
  const button = nodes(
    Display(),
    (n) => n.props?.["aria-label"] === "Reduce motion",
  )[0];
  assert.equal(button.props.role, "switch");
  assert.equal(button.props["aria-checked"], false);
  assert.equal(
    nodes(button, (n) => n.type === "i").length,
    0,
    "The inherited i thumb must not combine with the approved pseudo thumb",
  );
  assert.equal(button.props.className, "motion-switch");
  button.props.onClick();
  assert.equal(changed, true);
});

test("company essentials links Pro discovery directly to Plans", () => {
  const View = load("components/FreeSnapshot.tsx", "FreeSnapshot", {
    Link: "Link",
    amount: () => "—",
    dateLabel: () => "—",
  });
  const tree = View({
    research: {
      facts: [],
      company: { name: "Example" },
      quote: {},
      issues: [],
    },
  });
  const link = nodes(tree, (n) => n.type === "Link")[0];
  assert.equal(link.props.href, "/plans");
});

test("Settings presents compact groups on one page without duplicate account summaries", () => {
  const { tree } = settings({ routePrefix: "/preview" });
  const textNodes = (node) =>
    typeof node === "string"
      ? [node]
      : node && typeof node === "object"
        ? React.Children.toArray(node.props?.children).flatMap(textNodes)
        : [];
  assert.equal(
    textNodes(tree).filter((text) => text === "person@example.com").length,
    1,
  );
  assert.equal(nodes(tree, (n) => n.props?.hidden === true).length, 0);
  const groups = nodes(tree, (n) => n.type === "details");
  assert.equal(groups.length, 3);
  assert.ok(
    groups.every((group) => !group.props.open),
    "Settings starts with compact, expandable groups",
  );
  assert.equal(
    nodes(tree, (n) => n.type === "input" && n.props.type === "password")
      .length,
    1,
    "Account controls remain available inside their disclosure",
  );
  assert.equal(
    nodes(tree, (n) => n.type === "Link" && n.props.href === "/preview/plans")
      .length,
    1,
  );
  assert.equal(
    nodes(
      tree,
      (n) =>
        n.type === "nav" && n.props["aria-label"] === "Legal and methodology",
    ).length,
    0,
    "The shared footer already supplies legal links",
  );
  assert.doesNotMatch(textNodes(tree).join(" "), /AURYN decision system/i);
  assert.doesNotMatch(textNodes(tree).join(" "), /Business.*Value.*Risk.*Pace/);
});
