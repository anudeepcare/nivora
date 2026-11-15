import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import { dateLabel } from "../../lib/format.ts";
export function loadHomeNews(page = 0, setPage = () => {}, effects = []) {
  const code = ts.transpileModule(fs.readFileSync("components/HomeNewsFeed.tsx", "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const modules = {
    react: { ...React, useState: () => [page, setPage], useEffect: (effect) => effects.push(effect) },
    "react/jsx-runtime": jsx,
    "lucide-react": icons,
    "next/link": ({children, ...props}) => React.createElement("a", props, children),
    "@/lib/format": { dateLabel },
    "@/lib/approved-workspace": { researchLink: (symbol, prefix) => `${prefix}/research/${symbol}` },
    "./Ui": { SecurityLogo: ({symbol}) => React.createElement("i", { "data-logo": symbol }) },
    "./HomeNewsFeed.module.css": new Proxy({}, { get: (_, key) => String(key) }),
  };
  const module = { exports: {} };
  new Function("require", "module", "exports", code)((name) => {
    if (!(name in modules)) throw Error(name);
    return modules[name];
  }, module, module.exports);
  return module.exports.default;
}
