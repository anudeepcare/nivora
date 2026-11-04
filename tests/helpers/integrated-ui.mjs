import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as icons from "lucide-react";
import * as pace from "../../lib/pace-presentation.ts";
import * as reading from "../../lib/pace-instrument.ts";
export const experience = new Proxy(
  {},
  { get: (_, key) => `integrated-${String(key)}` },
);
const code = ts.transpileModule(
  fs.readFileSync("components/PaceInstrument.tsx", "utf8"),
  {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  },
).outputText;
const jsx = await import("react/jsx-runtime");
const mod = { exports: {} };
new Function("require", "module", "exports", code)(
  (name) => {
    if (name === "react") return React;
    if (name === "react/jsx-runtime") return jsx;
    if (name === "lucide-react") return icons;
    if (name === "@/lib/pace-presentation") return pace;
    if (name === "@/lib/pace-instrument") return reading;
    if (name.endsWith(".module.css"))
      return { __esModule: true, default: experience };
    throw Error(name);
  },
  mod,
  mod.exports,
);
export const PaceInstrument = mod.exports.default;
