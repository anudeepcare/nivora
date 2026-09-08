import * as auditModule from '../.engine-test/auryn/v8/reality-audit.js';
const {runV8RealityAudit}=auditModule;
const report=runV8RealityAudit();
console.log(`AURYN V8 Reality Audit: ${report.passed}/${report.total} passed`);
for(const v of report.violations)console.error(`${v.symbol} [${v.code}] ${v.message}`);
if(report.violations.length)process.exitCode=1;
