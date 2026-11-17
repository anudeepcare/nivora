const reason='Historical portfolio valuation is disabled: adjusted prices cannot be combined with unadjusted ledger quantities without verified dated splits, distributions and corporate actions.';

export function buildSecuritiesValuationHistory(){
  return{status:'unavailable',reason,scope:'securities-only',rows:[]};
}

export function renderSecuritiesValuationHistory(_value,escape=input=>String(input)){
  return`<div class="empty-chart"><span>Unavailable</span><p>${escape(reason)}</p></div>`;
}
