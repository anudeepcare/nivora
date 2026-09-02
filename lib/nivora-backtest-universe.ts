
export type UniverseEntry={symbol:string;cik?:string|number|null};
export type UniverseManifest={
 meta?:{pointInTimeCorrect?:boolean;includesDelisted?:boolean;delistingReturnsHandled?:boolean;source?:string;asOfDate?:string};
 symbols?:UniverseEntry[];
};

export function validateUniverseManifest(input:UniverseEntry[]|UniverseManifest){
 const manifest:Array<UniverseEntry>=Array.isArray(input)?input:(Array.isArray(input.symbols)?input.symbols:[]);
 const meta=Array.isArray(input)?{}:input.meta||{};
 const pointInTimeCorrect=Boolean(meta.pointInTimeCorrect&&meta.asOfDate&&meta.source);
 const includesDelisted=Boolean(meta.includesDelisted);
 const delistingReturnsHandled=Boolean(meta.delistingReturnsHandled);
 const survivorshipBiasControlled=pointInTimeCorrect&&includesDelisted&&delistingReturnsHandled;
 const missingCikPct=manifest.length?manifest.filter(x=>!x.cik).length/manifest.length*100:100;
 const quality=survivorshipBiasControlled&&missingCikPct<=10?"DECISION_GRADE" as const:manifest.length?"LIMITED" as const:"INVALID" as const;
 const warnings:string[]=[];
 if(!pointInTimeCorrect)warnings.push("Universe membership is not proven point-in-time correct.");
 if(!includesDelisted)warnings.push("Delisted/removed securities are not explicitly included; survivorship bias may remain.");
 if(!delistingReturnsHandled)warnings.push("Delisting returns are not explicitly handled; failed securities can otherwise disappear before the outcome horizon.");
 if(missingCikPct>10)warnings.push(`${missingCikPct.toFixed(1)}% of symbols are missing CIK identifiers, limiting point-in-time SEC reconstruction.`);
 return{quality,survivorshipBiasControlled,pointInTimeCorrect,includesDelisted,delistingReturnsHandled,missingCikPct:+missingCikPct.toFixed(1),entries:manifest,warnings,meta};
}
