import test from 'node:test';
import assert from 'node:assert/strict';
let mod;
try { mod=await import('../.engine-test/auryn/v91/base-metrics.js'); } catch {}
const makeBars=(symbol,n,start=100,step=.5,volume=1_000_000)=>Array.from({length:n},(_,i)=>{
  const close=start+i*step+(i%7===0?.8:0);
  return{symbol,date:new Date(Date.UTC(2020,0,2+i)).toISOString().slice(0,10),open:close-.3,high:close+1,low:close-1,close,volume:volume+(i%10)*20_000,adjusted:true};
});

test('V9.1 reconstructs a broad signed price/volume metric core using completed history only',()=>{
  assert.ok(mod,'V9.1 base metric module must exist');
  const bars=makeBars('AAA',300,100,.4);
  const bench=makeBars('SPY',300,300,.15);
  const r=mod.computeHistoricalBaseMetrics(bars,bench,{revenue_growth:22,forward_pe:31},299);
  for(const key of ['sma20','sma50','sma200','ema20','ema50','ma_stack','ma_slope','rsi14','rsi5','rsi21','macd_line','macd_histogram','adx14','dmi_plus','dmi_minus','stochastic','cci20','roc20','mfi14','bollinger_percent_b','bollinger_width','atr14','realized_vol20','relative_volume','obv_slope','cmf20','support_distance','resistance_distance','breakout_state','rs_vs_spy','vwap_distance']){
    assert.equal(Number.isFinite(r.metrics[key]),true,`missing ${key}`);
  }
  assert.ok(r.metrics.sma20>0,'uptrend should be above SMA20');
  assert.ok(r.metrics.rsi14>0,'centered RSI should be positive in persistent uptrend');
  assert.ok(r.metrics.rs_vs_spy>0,'faster stock trend should beat benchmark');
  assert.equal(r.metrics.revenue_growth,22);
  assert.equal(r.metrics.forward_pe,31);
  assert.ok(['RISK_ON','RISK_OFF','HIGH_VOL','NEUTRAL'].includes(r.regime));
});

test('V9.1 never uses bars after the requested historical index',()=>{
  const bars=makeBars('AAA',300,100,.2);
  const bench=makeBars('SPY',300,300,.1);
  const at250=mod.computeHistoricalBaseMetrics(bars,bench,{},250);
  const mutated=bars.map((b,i)=>i>250?{...b,close:b.close*20,high:b.high*20,low:b.low*20,open:b.open*20,volume:b.volume*50}:b);
  const still250=mod.computeHistoricalBaseMetrics(mutated,bench,{},250);
  assert.deepEqual(at250,still250,'future bars must not change historical metrics');
});

test('V9.1 external point-in-time metrics stay sparse and do not invent unavailable fundamentals',()=>{
  const bars=makeBars('AAA',80,50,.1);
  const bench=makeBars('SPY',80,200,.05);
  const r=mod.computeHistoricalBaseMetrics(bars,bench,{gross_margin:72},79);
  assert.equal(r.metrics.gross_margin,72);
  assert.equal('eps_revision_breadth' in r.metrics,false);
  assert.equal('forward_pe' in r.metrics,false);
});
