const money=value=>`$${value.toFixed(2)}`;

export function renderTransactionActivity(transactions,escape=value=>String(value),{disabled=false}={}){
  const rows=Array.isArray(transactions)?transactions:[];
  return `<section class="portfolio-activity"><small>TRANSACTION ACTIVITY · BROWSER-LOCAL</small><h3>Recorded FIFO chronology</h3><p>Corrections recompute the complete ledger. They do not create a market transaction.</p>${disabled?'<p class="warn">Repair the preserved ledger before editing transaction activity.</p>':''}${rows.length?`<div class="grid-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Security</th><th>Shares</th><th>USD price</th><th>Fees</th><th>Correction</th></tr></thead><tbody>${rows.map((trade,index)=>`<tr><td>${escape(trade.date)}</td><td>${escape(trade.type)}</td><td><b>${escape(trade.symbol)}</b></td><td>${escape(trade.shares)}</td><td>${money(trade.price)}</td><td>${money(trade.fees)}</td><td><button type="button" data-transaction-remove="${index}"${disabled?' disabled':''}>Remove entry</button></td></tr>`).join('')}</tbody></table></div>`:'<p>No transactions recorded.</p>'}</section>`;
}
