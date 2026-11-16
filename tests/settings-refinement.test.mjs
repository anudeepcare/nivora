import {experience,PaceInstrument} from './helpers/integrated-ui.mjs';
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
  bindings={APP_VERSION:"0.2.0-rc.2",ReleaseNotice:()=>null,ContextLink:({page,children,className})=>React.createElement('a',{href:'/'+page,className},children),...bindings};
  bindings = { settingsStyles: {page: "settings-page-module"}, experience, PaceInstrument, SUPPORT_EMAIL: "support@auryninvest.com", PrivacyChoices: () => null, useAccess: () => ({access:{capabilities:{paperTrading:false}}}), ...bindings };
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
  let signOutCalls = 0;
  const Shell = load("components/Shell.tsx", "Shell", {
    usePathname: () => location.pathname,
    useRouter: () => ({ push: (url) => pushes.push(url) }),
    useProduct: () => ({
      theme: "light",
      workspace: { email: "person@example.com" },
    }),
    useState: (value) => [value, () => {}],
    signOutAndRedirect: async () => { signOutCalls++; },
    Menu: () => null,
    LogOut: () => null,
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
    Ellipsis: empty,
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
  return { tree: Shell({ page, children: "content" }), pushes, signOutCalls: () => signOutCalls };
}
test("account menu retains Settings return context", () => {
  const { tree, pushes } = shell("research");
  const avatar = nodes(tree, n => n.props?.["aria-label"] === "Account and workspace tools")[0];
  assert.equal(avatar.type, "button");
  assert.equal(avatar.props["aria-haspopup"], "dialog");
  const settings = nodes(tree, n => n.type === "Link" && n.props.href === "/settings")[0];
  settings.props.onNavigate({preventDefault: empty});
  assert.deepEqual(pushes, ["/settings?from=%2Fresearch%2FMSFT%3Ftab%3Dfinancials%26q%3Dcloud%23income"]);
});
test("Explore keeps permitted destinations stable and marks the destination already open", () => {
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
      (n) => n.type === "dialog" && n.props["aria-label"] === "Account & workspace",
    )[0];
    assert.ok(dialog, "Explore must clearly identify its tools surface");
    const current = nodes(dialog, (n) => n.type === "Link" && n.props.href === `/${page}`);
    assert.equal(current.length, page === "trading" ? 0 : 1);
    if (current.length) assert.equal(current[0].props["aria-current"], "page");
    assert.ok(
      nodes(dialog, (n) => n.type === "Link" && n.props.href === "/compare")
        .length || page === "compare",
    );
  }
});
test("Settings menu marks the current destination without changing return context", () => {
 const {tree,pushes}=shell("settings",{pathname:"/settings",search:"?from=%2Fwatchlist%3Fq%3Dchip",hash:""});
 const dialog=nodes(tree,n=>n.type === "dialog" && n.props["aria-label"] === "Account & workspace")[0];
 const current=nodes(dialog,n=>n.type === "Link" && n.props.href === "/settings")[0];
 assert.equal(current.props["aria-current"],"page");
 current.props.onNavigate({preventDefault:empty});
 assert.deepEqual(pushes,[]);
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
    Menu: () => null,
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

test("Settings presents focused categories without duplicate account summaries", () => {
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
  assert.equal(nodes(tree, (n) => n.props?.hidden === true).length, 2);
  assert.equal(nodes(tree, (n) => n.type === "details").length, 1,
    "Infrequent password changes stay collapsed without removing the form");
  assert.equal(nodes(tree, (n) => n.type === "header").length, 3);
  assert.equal(
    nodes(tree, (n) => n.type === "input" && n.props.type === "password")
      .length,
    1,
    "Account controls remain available in their category",
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
test("Analytics preferences stays inside the Settings shortcut grid", () => {
  const { tree } = settings(
    { routePrefix: "/preview" },
    {
      PrivacyChoices: () =>
        React.createElement(
          "button",
          { className: "text-link settings-analytics-button" },
          "Analytics preferences",
        ),
    },
  );
  const slot = nodes(
    tree,
    (n) => n.props?.className === "settings-analytics-shortcut",
  )[0];
  assert.ok(slot, "Analytics must render as a shortcut card, not a loose link");
  assert.match(
    fs.readFileSync("components/SupportingViews.tsx", "utf8"),
    /settings-analytics-shortcut/,
  );
});


test("account menu signs out directly without navigating to Settings", async () => {
  const result = shell("research");
  const footer = nodes(result.tree, n => n.props?.className === "account-menu-footer")[0];
  const button = nodes(footer, n => n.type === "button")[0];
  assert.equal(button.props.disabled, false);
  await button.props.onClick();
  assert.equal(result.signOutCalls(), 1);
  assert.deepEqual(result.pushes, []);
});


test("Settings category changes rerender the matching panel and retain working controls", async () => {
  const slots = [];
  let cursor = 0;
  const persistentState = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], next => {
      slots[index] = typeof next === "function" ? next(slots[index]) : next;
    }];
  };
  const changes = [];
  const passwords = [];
  const Display = load("components/DisplayPreferences.tsx", "DisplayPreferences", {
    useProduct: () => ({ themePreference: "light", textSize: "standard", reduceMotion: false,
      setTheme: value => changes.push({theme: value}), setTextSize: empty, setReduceMotion: empty }),
    ResearchModeSwitch: empty,
    AppearanceControls: empty,
  });
  const Research = load("components/ResearchPreferences.tsx", "ResearchPreferenceControls", {
    useResearchPreferences: () => ({preferences:{style:"Balanced",horizon:"long"}, disabled:false,
      setPreferences: patch => changes.push(patch)}),
    WorkspacePreferences: empty,
  });
  const expand = node => {
    if (!node || typeof node !== "object") return node;
    if (node.props?.hidden) return node;
    if (typeof node.type === "function") return expand(node.type(node.props));
    return React.cloneElement(node, {}, React.Children.toArray(node.props?.children).map(expand));
  };
  const render = () => {
    cursor = 0;
    return expand(settings(undefined, {
      useState: persistentState,
      DisplayPreferences: Display,
      ResearchPreferenceControls: Research,
      authClient: () => ({auth:{updateUser:async value => {passwords.push(value);return {error:null};}}}),
    }).tree);
  };
  const assertPanel = (tree, active) => {
    const panels = nodes(tree, n => ["display-settings", "research-settings", "security-settings"].includes(n.props.id), true);
    assert.deepEqual(panels.map(n => n.props.id), [active+"-settings"], "Only the selected panel is visible after rerender");
    const choices = nodes(tree, n => n.type === "button" && n.props["aria-controls"], true);
    for (const choice of choices) assert.equal(choice.props["aria-pressed"], choice.props["aria-controls"] === active+"-settings");
  };
  const select = (tree, id) => nodes(tree, n => n.type === "button" && n.props["aria-controls"] === id+"-settings", true)[0].props.onClick();
  let tree = render();
  assertPanel(tree, "display");
  const dark = nodes(tree, n => n.type === "button" && n.props.children?.includes?.("Dark"), true)[0];
  assert.ok(dark, "Display controls are reachable in the selected panel");
  dark.props.onClick();
  assert.deepEqual(changes.at(-1), {theme:"dark"});

  select(tree, "research"); tree = render(); assertPanel(tree, "research");
  const style = nodes(tree, n => n.type === "select" && n.props.value === "Balanced", true)[0];
  assert.ok(style, "Research controls mount in the selected panel");
  assert.equal(style.props.disabled, false);
  style.props.onChange({target:{value:"Quality"}});
  assert.deepEqual(changes.at(-1), {style:"Quality"});

  select(tree, "security"); tree = render(); assertPanel(tree, "security");
  assert.ok(nodes(tree, n => n.type === "details" && n.props.className === "settings-password-change", true)[0], "Native password disclosure can be opened without a modal");
  const password = nodes(tree, n => n.type === "input" && n.props.type === "password", true)[0];
  password.props.onChange({target:{value:"unique-test-password"}});
  tree = render();
  assert.equal(nodes(tree, n => n.type === "input" && n.props.type === "password", true)[0].props.value, "unique-test-password");
  const submit = nodes(tree, n => n.type === "button" && n.props.className === "button primary", true)[0];
  assert.equal(submit.props.disabled, false);
  await nodes(tree, n => n.type === "form" && n.props.className === "password-form", true)[0].props.onSubmit({preventDefault(){}});
  assert.deepEqual(passwords, [{password:"unique-test-password"}]);
  tree = render();
  assert.equal(nodes(tree, n => n.type === "input" && n.props.type === "password", true)[0].props.value, "");
  select(tree, "display"); tree = render(); assertPanel(tree, "display");
  assert.ok(nodes(tree, n => n.type === "button" && n.props.className === "settings-signout", true)[0], "Sign out stays outside category panels");
});
