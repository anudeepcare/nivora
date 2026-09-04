#!/usr/bin/env node
import fs from "node:fs";import path from "node:path";

const roots=["app","components","lib"],problems=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx|js|mjs)$/.test(e.name)){const s=fs.readFileSync(p,"utf8");if(/false\s*&&\s*</.test(s))problems.push(`${p}: disabled JSX branch`);if(p.endsWith("StockClient.tsx")&&/function Help\(/.test(s))problems.push(`${p}: duplicate Help implementation`);if(p.endsWith("InvestorDecisionHero.tsx")&&/function MetricInfo\(/.test(s))problems.push(`${p}: duplicate MetricInfo implementation`)}}}
for(const r of roots)if(fs.existsSync(r))walk(r);
for(const f of fs.readdirSync(".")){if((/^README_V\d/i.test(f)||/^V\d.*(?:RELEASE|AUDIT|ARCHITECTURE).*\.md$/i.test(f))&&f!=="V65_RELEASE.md")problems.push(`${f}: legacy release document left in root`)}
for(const f of ["tsconfig.tsbuildinfo",".next",".engine-test"]){if(fs.existsSync(f))problems.push(`${f}: generated build artifact was not cleaned before packaging`)}
if(problems.length){console.error("V65 dead-code audit failed:\\n"+problems.map(x=>`- ${x}`).join("\\n"));process.exit(1)}
console.log("V65 dead-code audit PASS");
