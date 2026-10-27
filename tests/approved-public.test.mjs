import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";
import { authErrorMessage } from "../lib/auth-navigation.ts";
import {
  themePreference as parseThemePreference,
  resolvedTheme,
} from "../lib/theme-preference.ts";

function load(file, name, bindings) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declarations = source.statements.filter((n) =>
    ts.isFunctionDeclaration(n),
  );
  const code = declarations
    .map((n) =>
      n.getText(source).replace("export default ", "").replace("export ", ""),
    )
    .join("\n");
  const js = ts.transpileModule(code, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return new Function(...Object.keys(bindings), js + `;return ${name};`)(
    ...Object.values(bindings),
  );
}
const Link = ({ children, ...props }) =>
  React.createElement("a", props, children);
const Logo = () => React.createElement("span", null, "AURYN");
const common = {
  React,
  ...Object.fromEntries(
    [
      "ArrowRight",
      "Search",
      "FileText",
      "ChartNoAxesCombined",
      "Menu",
      "X",
      "Check",
      "ShieldCheck",
      "Layers3",
      "Scale",
      "PieChart",
    ].map((name) => [name, icons[name]]),
  ),
  Link,
  Logo,
  useEffect: () => {},
  useState: React.useState,
  useRouter: () => ({ replace() {} }),
};
const PublicSample = load(
  "components/PublicLanding.tsx",
  "PublicSample",
  common,
);
function nodes(root, predicate) {
  const found = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (predicate(node)) found.push(node);
    walk(node.props?.children);
  }
  walk(root);
  return found;
}
function accountHarness({
  mode = "login",
  provider = { google: true, x: true },
  auth = {},
} = {}) {
  let index = 0;
  const values = [],
    effects = [],
    routes = [];
  const useState = (initial) => {
    const i = index++;
    if (!(i in values))
      values[i] = typeof initial === "function" ? initial() : initial;
    return [
      values[i],
      (next) => {
        values[i] = typeof next === "function" ? next(values[i]) : next;
      },
    ];
  };
  const useEffect = (fn) => effects.push(fn);
  const component = load("components/Session.tsx", "Login", {
    ...common,
    PublicSample,
    useState,
    useEffect,
    authErrorMessage,
    authClient: () => ({ auth }),
    useRouter: () => ({ replace: (path) => routes.push(path) }),
  });
  const render = () => {
    index = 0;
    return component({ initialError: "" });
  };
  render();
  values[4] = mode;
  values[8] = provider;
  return {
    render,
    values,
    effects,
    routes,
    field: (name, value) =>
      nodes(
        render(),
        (n) => n.type === "input" && n.props.name === name,
      )[0].props.onChange({ target: { value } }),
    submit: () =>
      nodes(render(), (n) => n.type === "form")[0].props.onSubmit({
        preventDefault() {},
      }),
  };
}

test("public home leads with the benefit and an account action without fabricated investment claims", () => {
  const PublicLanding = load(
    "components/PublicLanding.tsx",
    "PublicLanding",
    common,
  );
  const html = renderToStaticMarkup(React.createElement(PublicLanding));
  assert.match(html, /<main[^>]*class="mp-public/);
  assert.match(html, /Know the stock\./);
  assert.match(html, /Know your next move\./);
  assert.match(html, /href="\/login\?mode=signup"[^>]*>Start free/);
  assert.match(html, /AURYN Pace/);
  assert.match(html, /Illustrative product guide/);
  assert(
    html.indexOf("Start free") < html.indexOf("Illustrative product guide"),
  );
  assert.match(html, /href="\/sample"/);
  assert.match(html, /href="\/pricing"/);
  assert.doesNotMatch(
    html,
    /Northstar|Microsoft|Apple Inc|Tesla|NVIDIA|NVDA|MSFT|AAPL|\+\d+(?:\.\d+)?%|\$124|data-demo-form|#\/research/,
  );
});

test("public and account previews explain Pace without fictional company results or an implied recommendation", () => {
  for (const compact of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(PublicSample, { compact }),
    );
    assert.match(html, /Illustrative product guide/);
    assert.match(html, /AURYN Pace/);
    assert.match(html, /not predicted returns/);
    assert.match(html, /Confirmed month/);
    assert.match(html, /Forming month/);
    assert.doesNotMatch(
      html,
      /Northstar|sample values|Revenue growth|FCF margin|Supportive <strong>7|\$\d|\+\d+(?:\.\d+)?%/,
    );
  }
});

test("public navigation opens accessibly, closes on Escape, and closes after a destination is chosen", () => {
  let expanded = false;
  const PublicLanding = load("components/PublicLanding.tsx", "PublicLanding", {
    ...common,
    useState: () => [
      expanded,
      (next) => {
        expanded = next;
      },
    ],
  });
  const render = () => PublicLanding({});
  const toggle = () =>
    nodes(
      render(),
      (n) =>
        n.type === "button" &&
        n.props["aria-controls"] === "ap-mobile-navigation",
    )[0];
  assert.equal(toggle().props["aria-expanded"], false);
  toggle().props.onClick();
  assert.equal(toggle().props["aria-expanded"], true);
  const navigation = nodes(
    render(),
    (n) => n.type === "nav" && n.props.id === "ap-mobile-navigation",
  )[0];
  assert(navigation);
  nodes(render(), (n) => n.type === "header")[0].props.onKeyDown({
    key: "Escape",
  });
  assert.equal(toggle().props["aria-expanded"], false);
  toggle().props.onClick();
  nodes(
    navigation,
    (n) => n.type === Link && n.props.href === "/pricing",
  )[0].props.onClick();
  assert.equal(toggle().props["aria-expanded"], false);
});

test("account modes keep labelled native fields, reachable submit and real legal/help routes", () => {
  for (const mode of ["login", "signup", "reset"]) {
    const harness = accountHarness({ mode });
    const html = renderToStaticMarkup(harness.render());
    assert.match(html, /<main[^>]*class="mp-auth/);
    assert.match(html, /<form[^>]*class="mp-auth-form"/);
    assert.match(html, /<label[^>]*for="auryn-signin-email"/);
    assert.equal(
      nodes(
        harness.render(),
        (n) => n.type === "input" && n.props.name === "email",
      )[0].props.autoComplete,
      "username",
    );
    assert.match(html, /<button[^>]*type="submit"/);
    assert.equal(
      nodes(
        harness.render(),
        (n) => n.type === "input" && n.props.name === "password",
      ).length,
      mode === "reset" ? 0 : 1,
    );
    assert.match(html, /href="\/terms"/);
    assert.match(html, /href="\/privacy"/);
    assert.match(html, /href="\/help"/);
    assert.doesNotMatch(
      html,
      /data-demo-form|No account will be created|sample password/,
    );
  }
});

test("email sign-in trims email, keeps password intact and opens the account workspace", async () => {
  const calls = [];
  const harness = accountHarness({
    auth: {
      signInWithPassword: async (value) => {
        calls.push(value);
        return { data: { session: { user: { id: "account" } } }, error: null };
      },
    },
  });
  harness.field("email", "  person@example.com  ");
  harness.field("password", " valid password ");
  await harness.submit();
  assert.deepEqual(calls, [
    { email: "person@example.com", password: " valid password " },
  ]);
  assert.deepEqual(harness.routes, ["/overview"]);
});

test("signup submits name metadata to real auth and keeps confirmation feedback with resend available", async () => {
  const calls = [];
  const previous = globalThis.window;
  globalThis.window = { location: { origin: "https://auryn.example" } };
  try {
    const harness = accountHarness({
      mode: "signup",
      auth: {
        signUp: async (value) => {
          calls.push(value);
          return { data: { session: null, user: { id: "new" } }, error: null };
        },
      },
    });
    harness.field("email", "  person@example.com ");
    harness.field("password", "abcdefgh");
    const name = nodes(
      harness.render(),
      (n) => n.type === "input" && n.props.name === "name",
    );
    assert.equal(name.length, 1, "signup offers the approved name field");
    name[0].props.onChange({ target: { value: "  Ada Example  " } });
    await harness.submit();
    assert.deepEqual(calls, [
      {
        email: "person@example.com",
        password: "abcdefgh",
        options: {
          emailRedirectTo: "https://auryn.example/auth/callback",
          data: { full_name: "Ada Example" },
        },
      },
    ]);
    assert.deepEqual(harness.routes, []);
    const html = renderToStaticMarkup(harness.render());
    assert.match(html, /role="status"/);
    assert.match(html, /Resend confirmation email/);
  } finally {
    globalThis.window = previous;
  }
});

test("password reset uses the fixed recovery callback and renders confirmation without redirecting", async () => {
  const calls = [];
  const previous = globalThis.window;
  globalThis.window = { location: { origin: "https://auryn.example" } };
  try {
    const harness = accountHarness({
      mode: "reset",
      auth: {
        resetPasswordForEmail: async (...args) => {
          calls.push(args);
          return { data: {}, error: null };
        },
      },
    });
    harness.field("email", " person@example.com ");
    await harness.submit();
    assert.deepEqual(calls, [
      [
        "person@example.com",
        {
          redirectTo:
            "https://auryn.example/auth/callback?next=/reset-password",
        },
      ],
    ]);
    assert.deepEqual(harness.routes, []);
    assert.match(
      renderToStaticMarkup(harness.render()),
      /Check your email for the password reset link/,
    );
  } finally {
    globalThis.window = previous;
  }
});

test("available OAuth choices call their provider and disabled choices do not send an auth request", async () => {
  const calls = [];
  const previous = globalThis.window;
  globalThis.window = { location: { origin: "https://auryn.example" } };
  try {
    for (const provider of ["google", "x"]) {
      const harness = accountHarness({
        auth: {
          signInWithOAuth: async (value) => {
            calls.push(value);
            return {
              data: { provider, url: "https://auth.example" },
              error: null,
            };
          },
        },
      });
      const button = nodes(
        harness.render(),
        (n) =>
          n.type === "button" &&
          n.props["aria-label"] ===
            `Continue with ${provider === "google" ? "Google" : "X"}`,
      )[0];
      assert(button, "OAuth has an unambiguous accessible name");
      await button.props.onClick();
    }
    assert.deepEqual(
      calls.map((c) => c.provider),
      ["google", "x"],
    );
    assert(
      calls.every(
        (c) => c.options.redirectTo === "https://auryn.example/auth/callback",
      ),
    );
    const disabled = accountHarness({
      provider: { google: false, x: false },
      auth: {
        signInWithOAuth: async () => {
          throw Error("must not call");
        },
      },
    });
    const buttons = nodes(
      disabled.render(),
      (n) =>
        n.type === "button" &&
        n.props["aria-label"]?.startsWith("Continue with"),
    );
    assert.equal(buttons.length, 2);
    assert(buttons.every((b) => b.props.disabled));
  } finally {
    globalThis.window = previous;
  }
});

test("recovery keeps both password fields and blocks mismatched passwords before contacting auth", async () => {
  let index = 0;
  const values = [],
    calls = [];
  const useState = (initial) => {
    const i = index++;
    if (!(i in values)) values[i] = initial;
    return [
      values[i],
      (next) => {
        values[i] = next;
      },
    ];
  };
  const Recovery = load("components/PasswordRecovery.tsx", "PasswordRecovery", {
    ...common,
    PublicSample,
    useState,
    authClient: () => ({
      auth: {
        updateUser: async (data) => {
          calls.push(data);
          return { data: { user: {} }, error: null };
        },
      },
    }),
  });
  const render = () => {
    index = 0;
    return Recovery();
  };
  const inputs = nodes(render(), (n) => n.type === "input");
  assert.equal(inputs.length, 2);
  assert(
    inputs.every(
      (n) => n.props.autoComplete === "new-password" && n.props.minLength === 8,
    ),
  );
  inputs[0].props.onChange({ target: { value: "abcdefgh" } });
  inputs[1].props.onChange({ target: { value: "different" } });
  await nodes(render(), (n) => n.type === "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.deepEqual(calls, []);
  assert.match(renderToStaticMarkup(render()), /passwords do not match/);
  assert.match(renderToStaticMarkup(render()), /class="mp-auth/);
});

test("linked reset mode selects recovery without exposing account credentials in the URL", () => {
  const previous = globalThis.window;
  globalThis.window = { location: { search: "?mode=reset" } };
  try {
    const harness = accountHarness();
    harness.effects[0]();
    assert.equal(
      nodes(
        harness.render(),
        (node) => node.type === "input" && node.props.name === "password",
      ).length,
      0,
    );
    assert.match(renderToStaticMarkup(harness.render()), /Send reset link/);
  } finally {
    globalThis.window = previous;
  }
});

test("confirmation resend preserves the callback and suppresses a second request during cooldown", async () => {
  const previous = globalThis.window;
  globalThis.window = { location: { origin: "https://auryn.example" } };
  try {
    const calls = [];
    const harness = accountHarness({
      mode: "signup",
      auth: {
        resend: async (value) => {
          calls.push(value);
          return { data: { user: {}, session: null }, error: null };
        },
      },
    });
    harness.field("email", " person@example.com ");
    harness.values[5] = "Confirm your email";
    const resend = () =>
      nodes(
        harness.render(),
        (node) =>
          node.type === "button" &&
          node.props.className?.includes("mp-resend-button"),
      )[0];
    resend().props.onClick();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(resend().props.disabled, true);
    resend().props.onClick();
    await Promise.resolve();
    assert.deepEqual(calls, [
      {
        type: "signup",
        email: "person@example.com",
        options: { emailRedirectTo: "https://auryn.example/auth/callback" },
      },
    ]);
  } finally {
    globalThis.window = previous;
  }
});

test("successful password recovery updates real auth before redirect and an expired link stays on the form", async () => {
  for (const expired of [false, true]) {
    let index = 0;
    const values = [],
      calls = [];
    const previous = globalThis.window;
    globalThis.window = {
      location: { replace: (path) => calls.push(["redirect", path]) },
    };
    const useState = (initial) => {
      const i = index++;
      if (!(i in values)) values[i] = initial;
      return [
        values[i],
        (next) => {
          values[i] = next;
        },
      ];
    };
    const Recovery = load(
      "components/PasswordRecovery.tsx",
      "PasswordRecovery",
      {
        ...common,
        PublicSample,
        useState,
        authClient: () => ({
          auth: {
            updateUser: async (data) => {
              calls.push(["update", data]);
              return {
                data: { user: expired ? null : { id: "account" } },
                error: expired ? new Error("expired") : null,
              };
            },
          },
        }),
      },
    );
    const render = () => {
      index = 0;
      return Recovery();
    };
    try {
      const inputs = nodes(render(), (node) => node.type === "input");
      inputs.forEach((input) =>
        input.props.onChange({ target: { value: "new passphrase" } }),
      );
      await nodes(render(), (node) => node.type === "form")[0].props.onSubmit({
        preventDefault() {},
      });
      assert.deepEqual(
        calls,
        expired
          ? [["update", { password: "new passphrase" }]]
          : [
              ["update", { password: "new passphrase" }],
              ["redirect", "/overview"],
            ],
      );
      if (expired) {
        assert.match(renderToStaticMarkup(render()), /role="alert"/);
        assert.equal(
          nodes(
            render(),
            (node) => node.type === "button" && node.props.type === "submit",
          )[0].props.disabled,
          false,
        );
      }
    } finally {
      globalThis.window = previous;
    }
  }
});

function preferencesHarness() {
  let index = 0;
  let effectIndex = 0;
  const states = [],
    effects = [],
    dependencies = [];
  const useState = (initial) => {
    const slot = index++;
    if (!(slot in states))
      states[slot] = typeof initial === "function" ? initial() : initial;
    return [
      states[slot],
      (next) => {
        states[slot] = typeof next === "function" ? next(states[slot]) : next;
      },
    ];
  };
  const useEffect = (effect, deps) => {
    const slot = effectIndex++;
    if (
      !dependencies[slot] ||
      deps.some((value, i) => !Object.is(value, dependencies[slot][i]))
    ) {
      dependencies[slot] = deps;
      effects.push(effect);
    }
  };
  const Provider = load("components/Session.tsx", "StoreProvider", {
    React,
    useState,
    useEffect,
    useMemo: (fn) => fn(),
    useRef: (value) => ({ current: value }),
    useCallback: (fn) => fn,
    parseThemePreference,
    resolvedTheme,
    Context: { Provider: "account-context" },
  });
  const demo = { research: {}, workspace: {} };
  const render = () => {
    index = 0;
    effectIndex = 0;
    return Provider({ children: null, owner: "preview", demo }).props.value;
  };
  const flush = () => {
    const pending = effects.splice(0);
    pending.forEach((effect) => effect());
  };
  return { render, flush };
}

test("saved appearance preferences hydrate from matching markup without overwriting the boot palette or storage", () => {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    localStorage: globalThis.localStorage,
  };
  try {
    delete globalThis.window;
    const server = preferencesHarness().render();
    const stored = new Map([
      ["auryn-product-theme", "dark"],
      ["auryn-product-text", "large"],
      ["auryn-product-motion", "reduce"],
    ]);
    const writes = [],
      mutations = [];
    const dataset = new Proxy(
      { theme: "dark", textSize: "large", motion: "reduce" },
      {
        set(target, key, value) {
          mutations.push([key, value]);
          target[key] = value;
          return true;
        },
      },
    );
    globalThis.window = {
      matchMedia: () => ({
        matches: false,
        addEventListener() {},
        removeEventListener() {},
      }),
    };
    globalThis.localStorage = {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => {
        writes.push([key, value]);
        stored.set(key, value);
      },
    };
    globalThis.document = {
      documentElement: { dataset },
      querySelectorAll: () => [],
    };
    const client = preferencesHarness();
    const initial = client.render();
    const preferenceValues = (value) => [
      value.themePreference,
      value.textSize,
      value.reduceMotion,
    ];
    assert.deepEqual(
      preferenceValues(initial),
      preferenceValues(server),
      "server and first client render must select identical controls",
    );
    client.flush();
    assert.deepEqual(
      mutations,
      [],
      "mount must not temporarily apply default appearance over the boot script",
    );
    const hydrated = client.render();
    client.flush();
    assert.deepEqual(preferenceValues(hydrated), ["dark", "large", true]);
    assert.deepEqual(
      { ...dataset },
      { theme: "dark", textSize: "large", motion: "reduce" },
    );
    assert.deepEqual(
      writes,
      [],
      "hydration must never persist default preferences",
    );
    assert(
      !mutations.some(([key, value]) => key === "theme" && value === "light"),
    );
    hydrated.setTheme("system");
    client.render();
    client.flush();
    assert.equal(dataset.theme, "light");
    assert.deepEqual(writes, [["auryn-product-theme", "system"]]);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
