/** Bounded, memory-only diagnostics. Never records URLs, symbols, accounts or content. */
export type ExperienceMetrics = {longTasks:number;longestTaskMs:number;slowInteractions:number;longestInteractionMs:number;layoutShift:number};
const metrics:ExperienceMetrics={longTasks:0,longestTaskMs:0,slowInteractions:0,longestInteractionMs:0,layoutShift:0};
export function recordExperience(type:string,duration:number,shift=0) {
 if (!Number.isFinite(duration) || duration<0) return;
 if(type==='longtask'){metrics.longTasks++;metrics.longestTaskMs=Math.max(metrics.longestTaskMs,duration);}
 if(type==='event'){if(duration>200)metrics.slowInteractions++;metrics.longestInteractionMs=Math.max(metrics.longestInteractionMs,duration);}
 if(type==='layout-shift'&&Number.isFinite(shift)&&shift>0)metrics.layoutShift+=shift;
}
export function experienceSnapshot(){return {...metrics};}
