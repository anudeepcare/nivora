import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { createPortal } from "react-dom";
import * as icons from "lucide-react";
import * as pace from "../../lib/pace-presentation.ts";
import * as reading from "../../lib/pace-instrument.ts";
import * as decision from "../../lib/auryn-decision.ts";
import * as insights from "../../lib/pace-insights.ts";
import * as format from "../../lib/format.ts";
export const experience = new Proxy(
  {},
  { get: (_, key) => `integrated-${String(key)}` },
);
// Load the real shared help so Pace rendering exercises its accessible trigger.
const uiSource = ts.createSourceFile("components/Ui.tsx", fs.readFileSync("components/Ui.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const helpDeclaration = uiSource.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === "Help");
const helpCode = ts.transpileModule(helpDeclaration.getText(uiSource).replace("export ", ""), { compilerOptions: { jsx: ts.JsxEmit.React } }).outputText;
const Help = new Function("React", "useRef", "useId", "useState", "useEffect", "createPortal", "Info", "X", "styles", helpCode + ";return Help;")(React, React.useRef, React.useId, React.useState, React.useEffect, createPortal, icons.Info, icons.X, experience);
const helpModule = { exports: {} };
const helpModuleCode = ts.transpileModule(fs.readFileSync("components/PaceHelp.tsx", "utf8"), {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const jsx = await import("react/jsx-runtime");
new Function("require", "module", "exports", helpModuleCode)((name) => {
  if (name === "react") return React;
  if (name === "./PacePriceZones") return {__esModule:true,default:()=>null};
  if (name === "react/jsx-runtime") return jsx;
  if (name === "@/lib/pace-presentation") return pace;
  if (name === "./Ui") return { Help };
  throw Error(name);
}, helpModule, helpModule.exports);
export const PaceHelp = helpModule.exports.default;
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
const mod = { exports: {} };
new Function("require", "module", "exports", code)(
  (name) => {
    if (name === "./PaceHelp") return { __esModule: true, default: PaceHelp };
    if (name === "react") return React;
    if (name === "react") return React;
  if (name === "./PacePriceZones") return {__esModule:true,default:()=>null};
  if (name === "react/jsx-runtime") return jsx;
    if (name === "lucide-react") return icons;
    if (name === "@/lib/pace-presentation") return pace;
    if (name === "@/lib/pace-instrument") return reading;
    if (name === "@/lib/auryn-decision") return decision;
    if (name === "@/lib/pace-insights") return insights;
    if (name === "@/lib/format") return format;
    if (name.endsWith(".module.css"))
      return { __esModule: true, default: experience };
    throw Error(name);
  },
  mod,
  mod.exports,
);
export const PaceInstrument = mod.exports.default;
