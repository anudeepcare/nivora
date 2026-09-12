import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {runAurynValidationLab}=require("../.engine-test/auryn/v99/validation-lab.js");
const report=runAurynValidationLab();
console.log(JSON.stringify(report,null,2));
if(report.status==="FAIL")process.exitCode=1;
