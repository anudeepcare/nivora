
export type RankedRisk={category:"TIMING"|"VALUATION"|"FINANCIAL"|"GROWTH"|"FORWARD"|"VOLATILITY"|"EXECUTION";severity:"HIGH"|"MEDIUM"|"LOW";evidence:string;breaker:string};
export function buildAdversarialRisks(x:{archetype:string;timingScore:number;factors:Record<string,number|null>;existingRisks:string[];breakers:string[];valuationWarnings:string[]}):RankedRisk[]{
 const r:RankedRisk[]=[];const add=(category:RankedRisk["category"],severity:RankedRisk["severity"],evidence:string,breaker:string)=>{if(!r.some(z=>z.category===category))r.push({category,severity,evidence,breaker})};
 if(x.timingScore<45)add("TIMING",x.timingScore<30?"HIGH":"MEDIUM",`Timing score is ${x.timingScore}/100; price structure has not confirmed the long-term thesis.`,`Timing weakness persists while the stock remains extended or fails to stabilize.`);
 if(x.valuationWarnings.length)add("VALUATION","MEDIUM",x.valuationWarnings[0],`Valuation assumptions fail sanity checks or expected-return compression removes margin of safety.`);
 const f=x.factors||{};
 if((f.financial??50)<55)add("FINANCIAL",(f.financial??50)<40?"HIGH":"MEDIUM",`Financial factor is ${f.financial}/100.`,x.breakers[0]||"Cash generation, margins or balance-sheet quality deteriorate materially.");
 if((f.forward??50)<55)add("FORWARD",(f.forward??50)<40?"HIGH":"MEDIUM",`Forward-evidence factor is ${f.forward}/100.`,x.breakers[0]||"Forward estimates/guidance deteriorate for multiple periods.");
 if((f.growth??50)<55)add("GROWTH","MEDIUM",`Growth factor is ${f.growth}/100.`,x.breakers[0]||"Growth decelerates enough to impair expected returns.");
 if((f.risk??50)>=65)add("VOLATILITY",(f.risk??50)>=75?"HIGH":"MEDIUM",`Risk-pressure factor is ${f.risk}/100.`,`Volatility/downside pressure rises enough to overwhelm the expected-return case.`);
 for(const e of x.existingRisks.slice(0,2))add("EXECUTION","MEDIUM",e,x.breakers[0]||"Execution evidence invalidates the thesis.");
 const fallback=x.archetype==="compounder"?"Margin/FCF durability is the key structural risk for a compounder.":x.archetype==="ai_infrastructure"?"Contract conversion, capacity deployment, capex funding and customer concentration are the key structural risks.":x.archetype==="pre_scale"?"Milestone execution, cash runway, dilution and commercialization probability are the key structural risks.":x.archetype==="hypergrowth"?"Growth durability, unit economics and dilution are the key structural risks.":"Execution and forward-estimate deterioration remain the core structural risks.";
 if(r.length<3)add("EXECUTION","LOW",fallback,x.breakers[0]||"Management execution deteriorates for more than one reporting cycle.");
 if(r.length<3)add("FORWARD","LOW","The market can re-rate the stock before reported fundamentals visibly weaken.",x.breakers[1]||"Forward expectations deteriorate across multiple evidence sources.");
 return r.slice(0,4);
}
