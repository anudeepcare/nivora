import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";

// Loading the public module should not evaluate the stock analysis engine.
// next/dynamic is the code-splitting boundary; its loader is intentionally idle
// until React renders the selected guide. Existing public tests exercise that UI.
test("public landing leaves the Pace research engine behind a deferred import", () => {
  const eager = [];
  const deferred = [];
  const code = ts.transpileModule(
    fs.readFileSync("components/PublicLanding.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const mod = { exports: {} };
  const component = () => null;
  new Function("require", "module", "exports", code)(
    (name) => {
      eager.push(name);
      if (name === "next/dynamic")
        return {
          __esModule: true,
          default: (loader) => {
            deferred.push(loader);
            return component;
          },
        };
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "lucide-react") return icons;
      if (name === "@/lib/site-metadata")
        return { SUPPORT_EMAIL: "support@example.invalid" };
      if (name === "@/lib/client")
        return {
          authClient: () => {
            throw Error("No auth call during module loading");
          },
        };
      if (name === "./ContextLink") return { ContextLink: component };
      if (name === "./AnalyticsConsent") return { PrivacyChoices: component };
      if (name === "next/navigation") return { useRouter: () => ({}) };
      if (
        name === "next/link" ||
        name.endsWith(".module.css") ||
        name === "./PaceInstrument"
      )
        return { __esModule: true, default: component };
      throw Error(`Unexpected dependency: ${name}`);
    },
    mod,
    mod.exports,
  );
  assert.ok(
    !eager.includes("./PaceInstrument"),
    "an unused illustrative tab must not synchronously import the price classifiers",
  );
  assert.equal(
    deferred.length,
    1,
    "the Pace guide retains an on-demand loader",
  );
  assert.equal(typeof mod.exports.default, "function");
});
