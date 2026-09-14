export function mergePositionMath(existing:{shares:number;avgCost:number}|null,incoming:{shares:number;avgCost:number}){
 const addShares=Number(incoming.shares||0),addAvg=Number(incoming.avgCost||0);
 if(!existing)return{shares:addShares,avgCost:addAvg};
 const oldShares=Number(existing.shares||0),oldAvg=Number(existing.avgCost||0),shares=oldShares+addShares;
 return{shares,avgCost:shares>0?(oldShares*oldAvg+addShares*addAvg)/shares:0};
}
