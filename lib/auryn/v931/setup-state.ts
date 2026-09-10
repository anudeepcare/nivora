import type {SetupState} from './domain';
const ladder:SetupState[]=['DAMAGED','REPAIRING','RECLAIM_ATTEMPT','BREAKOUT_WATCH','BREAKOUT_READY','BREAKOUT_CONFIRMED','TRENDING'];
const clamp=(x:number)=>Math.max(0,Math.min(100,Number.isFinite(x)?x:50));
function target(i:{trend:number;momentum:number;flow:number;structure:number;nearResistance:boolean;confirmedBreakout:boolean;structuralBreak:boolean}):SetupState{
 const trend=clamp(i.trend),momentum=clamp(i.momentum),flow=clamp(i.flow),structure=clamp(i.structure);
 if(i.structuralBreak)return'DAMAGED';
 if(i.confirmedBreakout&&trend>=62&&momentum>=60&&structure>=60)return'BREAKOUT_CONFIRMED';
 if(trend>=72&&momentum>=65&&structure>=65)return'TRENDING';
 if(i.nearResistance&&trend>=60&&momentum>=68&&flow>=60&&structure>=60)return'BREAKOUT_READY';
 if(i.nearResistance&&momentum>=58&&structure>=50)return'BREAKOUT_WATCH';
 if(trend>=45&&momentum>=50&&structure>=45)return'RECLAIM_ATTEMPT';
 if(trend>=30||structure>=35)return'REPAIRING';
 return'DAMAGED';
}
export function resolveSetupTransition(input:{previous:SetupState|null;trend:number;momentum:number;flow:number;structure:number;nearResistance:boolean;confirmedBreakout:boolean;structuralBreak:boolean}){
 const desired=target(input),previous=input.previous;
 const measured=[`trend ${Math.round(clamp(input.trend))}/100`,`momentum ${Math.round(clamp(input.momentum))}/100`,`participation ${Math.round(clamp(input.flow))}/100`,`structure ${Math.round(clamp(input.structure))}/100`,`near resistance ${input.nearResistance?'yes':'no'}`,`breakout confirmed ${input.confirmedBreakout?'yes':'no'}`];
 if(!previous)return{state:desired,changed:true,trigger:`Initial deterministic classification from measured setup evidence; target state ${desired}.`,changedEvidence:measured,unchangedEvidence:[] as string[]};
 if(input.structuralBreak)return{state:'DAMAGED' as SetupState,changed:previous!=='DAMAGED',trigger:'Structural invalidation was breached; price structure overrides gradual setup transitions.',changedEvidence:['structural break yes',...measured],unchangedEvidence:[] as string[]};
 const currentIndex=ladder.indexOf(previous);const desiredIndex=ladder.indexOf(desired);
 if(currentIndex<0)return{state:desired,changed:desired!==previous,trigger:'Legacy state normalized.',changedEvidence:['state-normalization'],unchangedEvidence:[] as string[]};
 // Hysteresis: hold the current state inside a small evidence band instead of chattering at thresholds.
 if(previous==='BREAKOUT_WATCH'&&desired==='RECLAIM_ATTEMPT'&&input.momentum>=54&&input.structure>=47)return{state:previous,changed:false,trigger:'Evidence moved but did not clear the downgrade hysteresis band.',changedEvidence:[],unchangedEvidence:['setup-state']};
 if(previous==='BREAKOUT_READY'&&desired==='BREAKOUT_WATCH'&&input.nearResistance&&input.momentum>=63&&input.structure>=55)return{state:previous,changed:false,trigger:'Evidence remains inside the breakout-ready hysteresis band.',changedEvidence:[],unchangedEvidence:['setup-state']};
 if(desiredIndex===currentIndex)return{state:previous,changed:false,trigger:'No material setup-state change.',changedEvidence:[],unchangedEvidence:['setup-state']};
 const step=desiredIndex>currentIndex?currentIndex+1:currentIndex-1;
 const state=ladder[Math.max(0,Math.min(ladder.length-1,step))];
 return{state,changed:state!==previous,trigger:`Measured setup evidence moved the state one validated step from ${previous} toward ${desired}; AURYN does not skip intermediate states without a structural break.`,changedEvidence:measured,unchangedEvidence:['business thesis unchanged by technical-only transition','valuation unchanged by technical-only transition']};
}
