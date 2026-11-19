import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("Scenarios removes Test assumptions and all personal calculator mounts per latest instruction",()=>{
 const s=fs.readFileSync("components/ValueStudio.tsx","utf8");
 assert.doesNotMatch(s,/Test assumptions|assumptionsOpen|ExpectationWorkbench|PriceProjection|DecisionInsights|ResearchWorkspace/);
 assert.match(s,/<SelectedValuation research=\{r\} headline=\{headline\}/);
 assert.match(s,/<AnalystTargets research=\{r\}/);
 assert.match(s,/<ScenarioLenses research=\{r\} hideSingle/);
});
test("source comparison does not claim a second primary forecast or mixed-horizon agreement",()=>{
 const s=fs.readFileSync("components/ScenarioLenses.tsx","utf8");
 assert.doesNotMatch(s,/data-primary=|Method agreement|Where the price sits|view\.asymmetry/);
 assert.match(s,/Source ranges by horizon/);
 assert.match(s,/Historical\s+ranges\s+describe past observations/);
});
test("large case prices wrap without concealing values",()=>{
 for(const file of ["SelectedValuation.module.css","ScenarioLenses.module.css"]) assert.match(fs.readFileSync("components/"+file,"utf8"),/overflow-wrap: anywhere/);
});
