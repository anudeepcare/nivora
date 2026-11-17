const rounded=value=>{const result=Math.round(value*100)/100;return Number.isFinite(result)?result:null};

export function calculateDcaIllustration({initial,monthly,months,annualReturnPercent}){
  const values=[initial,monthly,months,annualReturnPercent];
  if(!values.every(Number.isFinite)||initial<0||monthly<0||!Number.isInteger(months)||months<0||months>1200||annualReturnPercent< -100)return{status:'invalid',reason:'Inputs are outside supported bounds.'};
  const rate=(1+annualReturnPercent/100)**(1/12)-1;
  let value=initial;
  for(let month=0;month<months;month++){value=value*(1+rate)+monthly;if(!Number.isFinite(value))return{status:'invalid',reason:'Projection overflowed supported numeric bounds.'}}
  const contributed=initial+monthly*months,gain=value-contributed,display=[contributed,value,gain].map(rounded);
  if(![contributed,value,gain].every(Number.isFinite)||display.some(x=>x===null))return{status:'invalid',reason:'Projection overflowed supported numeric bounds.'};
  return{status:'available',contributed:display[0],endingValue:display[1],gain:display[2]};
}
