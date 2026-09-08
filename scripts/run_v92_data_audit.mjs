import fs from 'node:fs';import path from 'node:path';
const valueArg=n=>{const p=`--${n}=`;const a=process.argv.find(x=>x.startsWith(p));return a?a.slice(p.length):''};
const inputPath=valueArg('input')||process.env.AURYN_V92_REPLAY_BUNDLE||'';if(!inputPath)throw new Error('Usage: npm run audit:v92-data -- --input=/path/replay-bundle.json');
const {auditV92ReplayBundle}=await import('../.engine-test/auryn/v92/integrity.js');
const bundle=JSON.parse(fs.readFileSync(path.resolve(inputPath),'utf8'));const report=auditV92ReplayBundle(bundle);
const symbols=report.coverage.securities||0,withBars=report.coverage.symbolsWithBars||0,coveragePct=symbols?withBars/symbols*100:0;
const minCoverage=Number(valueArg('min-symbol-coverage')||process.env.AURYN_V92_MIN_SYMBOL_COVERAGE||90),minYears=Number(valueArg('min-years')||process.env.AURYN_V92_MIN_YEARS||1),years=Object.keys(report.coverage.years).length;
const requiredFamilies=String(valueArg('required-families')||process.env.AURYN_V92_REQUIRED_FAMILIES||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
const maxSessionGapPct=Number(valueArg('max-session-gap-pct')||process.env.AURYN_V92_MAX_SESSION_GAP_PCT||1);
const expectedSessions=Math.max(1,report.coverage.sessionExpectedCount||0);const sessionGapPct=report.coverage.sessionGapCount/expectedSessions*100;
const gateFailures=[];if(coveragePct<minCoverage)gateFailures.push(`Symbol bar coverage ${coveragePct.toFixed(2)}% is below required ${minCoverage.toFixed(2)}%.`);if(years<minYears)gateFailures.push(`Historical coverage spans ${years} years; at least ${minYears} required.`);if(report.coverage.corporateActionCorruptionCount>0)gateFailures.push(`${report.coverage.corporateActionCorruptionCount} corporate-action adjustment corruption findings detected.`);if(sessionGapPct>maxSessionGapPct)gateFailures.push(`Benchmark-session gap rate ${sessionGapPct.toFixed(4)}% exceeds ${maxSessionGapPct.toFixed(4)}%.`);
for(const family of requiredFamilies){const rows=report.coverage.familyRows?.[family]??0,coverage=report.coverage.adapterCoverage?.[family]??0;if(rows<=0&&coverage<=0)gateFailures.push(`Required historical family ${family} has no rows or verified adapter coverage.`);}
const requireDecisionGrade=process.argv.includes('--require-decision-grade')||process.env.AURYN_V92_REQUIRE_DECISION_GRADE==='1';if(requireDecisionGrade&&report.quality!=='DECISION_GRADE')gateFailures.push(`Dataset quality is ${report.quality}; DECISION_GRADE is required.`);
const status=report.status==='PASS'&&!gateFailures.length?'PASS':'BLOCKED';const final={...report,status,gate:{symbolCoveragePct:+coveragePct.toFixed(4),minSymbolCoveragePct:minCoverage,years,minYears,requireDecisionGrade,requiredFamilies,maxSessionGapPct,sessionGapPct:+sessionGapPct.toFixed(6),failures:gateFailures}};
const out=valueArg('output');if(out){const p=path.resolve(out);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(final,null,2)+'\n');}
console.log(JSON.stringify(final,null,2));if(status==='BLOCKED')process.exitCode=1;
