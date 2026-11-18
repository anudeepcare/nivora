import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function extract(file, names, bindings) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const raw = source.statements
    .filter((n) => ts.isFunctionDeclaration(n) && names.includes(n.name?.text))
    .map((n) => n.getText(source).replace(/^export /, ""))
    .join("\n");
  const js = ts.transpileModule(raw, {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
  }).outputText;
  return new Function(
    ...Object.keys(bindings),
    js + `;return ${names.at(-1)};`,
  )(...Object.values(bindings));
}
const access = {
  owner: false,
  plan: "free",
  source: "free",
  limits: { research: 100 },
};
function render(billing) {
  let i = 0;
  const states = [billing, "", false];
  const C = extract("components/Plans.tsx", ["SignedInPlans"], {
    React,
    useAccess: () => ({ access, refresh() {} }),
    useState: () => [states[i++], () => {}],
    useEffect: () => {},
    PricingCards: () => null,
    Link: ({ children, ...p }) => React.createElement("a", p, children),
  });
  return renderToStaticMarkup(React.createElement(C));
}
test("Stripe management remains available when subscription access expired or complimentary", () => {
  for (const source of ["free", "complimentary", "subscription"]) {
    const html = render({
      access: { ...access, source, grantUntil: "2030-01-01" },
      canManage: true,
      ready: true,
      subscription: null,
    });
    assert.match(html, /Manage or cancel subscription/);
    assert.doesNotMatch(html, /<button[^>]*disabled/);
    assert.match(html, /opening the portal does not cancel anything/);
  }
});
test("non-Stripe and unavailable billing are explicit and do not imply a cancellation", () => {
  assert.doesNotMatch(
    render({ access, canManage: false, ready: true }),
    /Manage or cancel subscription/,
  );
  assert.match(
    render({ access, canManage: false, ready: true }),
    /No Stripe billing account/,
  );
  const html = render({ access, canManage: true, ready: false });
  assert.match(html, /<button[^>]*disabled/);
  assert.match(html, /No subscription has been cancelled/);
});
test("portal uses only authenticated user and mode binding, never creates a customer for non-Stripe users", async () => {
  let bound = "cus_self";
  const calls = [];
  const query = {
    select() {
      return this;
    },
    eq(k, v) {
      calls.push([k, v]);
      return this;
    },
    async maybeSingle() {
      return { data: bound ? { customer_id: bound } : null };
    },
  };
  const action = extract("lib/billing.ts", ["binding", "billingAction"], {
    billingMode: () => "test",
    billingConfig: () => ({ origin: "https://auryn.example", mode: "test" }),
    stripeClient: () => ({
      billingPortal: {
        sessions: {
          create: async (p) => {
            calls.push(p);
            return { url: "https://billing.stripe.com/session" };
          },
        },
      },
    }),
    accessDb: () => ({ from: () => query }),
    HttpError: Error,
  });
  await action("authenticated_user", undefined, "portal");
  assert.deepEqual(calls.slice(0, 2), [
    ["user_id", "authenticated_user"],
    ["mode", "test"],
  ]);
  assert.deepEqual(calls[2], {
    customer: "cus_self",
    return_url: "https://auryn.example/plans?billing=return",
  });
  bound = null;
  await assert.rejects(
    action("another_user", undefined, "portal"),
    /No subscription to manage/,
  );
  assert.equal(calls.filter((x) => x.customer).length, 1);
});
test("route ignores body customer/user identifiers and requires account authentication", async () => {
  let seen;
  const post = extract("app/api/billing/route.ts", ["POST"], {
    account: async () => ({
      user: { id: "signed_in", email: "own@example.com" },
    }),
    limit: async () => {},
    privateJson: (x) => x,
    billingAction: async (...args) => {
      seen = args;
      return { url: "ok" };
    },
    billingFailure: (e) => {
      throw e;
    },
    HttpError: Error,
  });
  await post(
    new Request("https://auryn.example/api/billing", {
      method: "POST",
      body: JSON.stringify({
        action: "portal",
        user: "victim",
        customer: "cus_victim",
      }),
    }),
  );
  assert.equal(seen[0], "signed_in");
  assert.equal(seen[1], "own@example.com");
  assert.equal(seen[2], "portal");
  const rejected = extract("app/api/billing/route.ts", ["POST"], {
    account: async () => {
      throw Error("Sign in required");
    },
    billingFailure: (e) => {
      throw e;
    },
  });
  await assert.rejects(
    rejected(new Request("https://auryn.example")),
    /Sign in required/,
  );
});
