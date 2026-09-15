import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const o=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("lib/auryn/v99929/cio-decision.ts","utf8"),r=fs.readFileSync("lib/auryn/v99930/regime-structure.ts","utf8"),cl=fs.readFileSync("lib/auryn/v4/classification.ts","utf8"),css=fs.readFileSync("app/auryn-premium.css","utf8");
test("CIO consumes canonical actions instead of inventing a second verdict",()=>{for(const x of ["canonicalNewMoneyAction","canonicalOwnerAction","canonicalLongTermAction"])assert.ok(c.includes(x),x);assert.match(o,/canonicalNewMoneyAction:decision\.newMoneyAction/);});
test("execution map never merges risk with entry or confirm with targets",()=>{assert.match(o,/sameSemanticFamily/);assert.match(o,/prev\.family===family/);});
test("invalid 5y regime rebuilds from recent weekly structure instead of staying generic",()=>{for(const x of ["rebuildRecentRegime","recentWeeks","RECENT_REGIME"])assert.ok(r.includes(x),x);});
test("bank classification requires financial identity, not incidental description words",()=>{assert.ok(!cl.includes('["BANK",/\\\\bbank\\\\b|banking|investment banking/]'));assert.match(cl,/financialIdentity/);});
test("partial fundamental value shows available evidence and missing inputs",()=>{for(const x of ["AVAILABLE NOW","STILL NEEDED","missingMethodInputs"])assert.ok(o.includes(x),x);});
test("roadmap header reports rebuilding truth, not raw defensive state",()=>{assert.match(o,/structuralTruthValid\?pretty\(activeLongTerm\?\.state\):"REBUILDING"/);});
test("help popovers are edge-aware",()=>{assert.match(css,/v2AnalystCard:nth-child\(1\).*v99928HelpPopover/);assert.match(css,/v2AnalystCard:nth-child\(2\).*v99928HelpPopover/);});
