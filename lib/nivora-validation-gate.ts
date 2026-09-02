
export type ValidationStatus="UNVALIDATED"|"BACKTESTED"|"OUT_OF_SAMPLE_VERIFIED"|"FORWARD_VALIDATING"|"VALIDATED";
export type ValidationEvidenceInput={
 historicalN:number;oosN:number;forwardN:number;avgAlphaPct:number;hitRatePct:number;
 brierScore:number;ecePct:number;maxDrawdownPct:number;regimesPassed:number;archetypesPassed:number;
 dataQualityPassed?:boolean;
};
export type ValidationEvidenceResult={status:ValidationStatus;passed:string[];failed:string[];headline:string};

export function evaluateValidationEvidence(x:ValidationEvidenceInput):ValidationEvidenceResult{
 const passed:string[]=[],failed:string[]=[];
 const gate=(ok:boolean,label:string)=>{(ok?passed:failed).push(label);return ok};
 const historical=gate(x.historicalN>=1000,"Historical sample ≥ 1,000");
 const alpha=gate(x.avgAlphaPct>0,"Positive benchmark-relative alpha");
 const calibration=gate(x.brierScore<=.25&&x.ecePct<=10,"Calibration quality within preregistered limits");
 const drawdown=gate(x.maxDrawdownPct>=-30,"Maximum drawdown within preregistered limit");
 const breadth=gate(x.regimesPassed>=3&&x.archetypesPassed>=3,"Evidence spans ≥3 regimes and ≥3 archetypes");
 const dataQuality=gate(x.dataQualityPassed!==false,"Historical data quality / survivorship-bias controls passed");
 const base=historical&&alpha&&calibration&&drawdown&&breadth&&dataQuality;
 const oos=gate(x.oosN>=500,"Untouched out-of-sample sample ≥ 500");
 const forward=gate(x.forwardN>=100,"Forward-live comparable sample ≥ 100");

 let status:ValidationStatus="UNVALIDATED";
 if(base)status="BACKTESTED";
 if(base&&oos)status="OUT_OF_SAMPLE_VERIFIED";
 if(base&&oos&&x.forwardN>0&&x.forwardN<100)status="FORWARD_VALIDATING";
 if(base&&oos&&forward)status="VALIDATED";
 if(!alpha&&status!=="UNVALIDATED")status="UNVALIDATED";

 const headline=status==="VALIDATED"?"Historical, out-of-sample and forward evidence passed the preregistered gates.":
  status==="FORWARD_VALIDATING"?"Historical and out-of-sample evidence passed; forward-live evidence is still accumulating.":
  status==="OUT_OF_SAMPLE_VERIFIED"?"Untouched out-of-sample evidence passed; forward validation is next.":
  status==="BACKTESTED"?"Historical backtest gates passed; untouched out-of-sample evidence is still required.":
  "The current evidence does not meet the minimum validation bar.";
 return{status,passed,failed,headline};
}
