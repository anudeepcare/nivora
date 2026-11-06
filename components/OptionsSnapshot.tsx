import type { OptionContract } from '@/lib/options-analysis';
import { busiestStrike } from '@/lib/options-snapshot';
import { amount, dateLabel } from '@/lib/format';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import s from './OptionsSnapshot.module.css';
export default function OptionsSnapshot({contracts,spot,expiry}:{contracts:OptionContract[];spot:number;expiry:string}) {
  return <section className={s.snapshot} aria-label="Options at a glance">
    <header><h3>Where is trading busiest?</h3><span>Expires {dateLabel(expiry)}</span></header>
    <div className={s.levels}>{(['call','put'] as const).map(type => {
      const level=busiestStrike(contracts,type,expiry);
      return <article key={type} data-side={type}>
        <span>{type==='call'?<ArrowUpRight size={18}/>:<ArrowDownRight size={18}/>} Most traded {type} strike</span>
        <strong>{level?amount(level.strike):'No volume reported'}</strong>
        {level && <><p>{level.volume.toLocaleString()} contracts{level.tied?' · tied for highest':''}</p><small>{spot>0?`${(Math.abs(level.strike-spot)/spot*100).toFixed(1)}% ${level.strike>=spot?'above':'below'} stock price · `:''}{dateLabel(level.observed)}</small></>}
      </article>;
    })}</div>
    <p className={s.note}>Volume counts trades in the reported session. It does not show whether traders bought or sold, or predict a price target. Rankings cover loaded contracts only.</p>
    <details><summary>Calls, puts and gamma—in plain English</summary>
      <dl><dt>Call</dt><dd>A right to buy shares at the strike price by expiration.</dd><dt>Put</dt><dd>A right to sell shares at the strike price by expiration.</dd><dt>Strike</dt><dd>The contract’s price level, not a forecast for the stock.</dd><dt>Open interest</dt><dd>Contracts still open. Different from trading volume.</dd><dt>Gamma</dt><dd>How quickly an option’s sensitivity to the stock changes. The heatmap estimates where that exposure is concentrated; a large level is not guaranteed support or resistance.</dd></dl>
    </details>
  </section>;
}
