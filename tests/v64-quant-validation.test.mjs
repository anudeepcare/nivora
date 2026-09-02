
import test from "node:test";
import assert from "node:assert/strict";
import {rsi,atr} from "../.engine-test/quant.js";
import {computeTechnicalSnapshot} from "../.engine-test/nivora-technical-engine.js";

test("RSI uses Wilder smoothing and matches a fixed reference sequence",()=>{
 const values=[44.34,44.09,44.15,43.61,44.33,44.83,45.10,45.42,45.84,46.08,45.89,46.03,45.61,46.28,46.28,46.00,46.03,46.41,46.22,45.64,46.21];
 const x=rsi(values,14);
 assert.ok(Math.abs(x-62.88)<0.15,`expected Wilder RSI about 62.88, got ${x}`);
});

test("ATR uses Wilder smoothing rather than a flat trailing mean",()=>{
 const rows=[
  [48.7,47.79,48.16],[48.72,48.14,48.61],[48.9,48.39,48.75],[48.87,48.37,48.63],[48.82,48.24,48.74],
  [49.05,48.64,49.03],[49.2,48.94,49.07],[49.35,48.86,49.32],[49.92,49.5,49.91],[50.19,49.87,50.13],
  [50.12,49.2,49.53],[49.66,48.9,49.5],[49.88,49.43,49.75],[50.19,49.73,50.03],[50.36,49.26,50.31],
  [50.57,50.09,50.52],[50.65,50.3,50.41],[50.43,49.21,49.34],[49.63,48.98,49.37],[50.33,49.61,50.23]
 ].map(([high,low,close],i)=>({high,low,close,open:close,volume:1,datetime:`2020-01-${String(i+1).padStart(2,"0")}`}));
 const x=atr(rows,14);
 assert.ok(x>0.5&&x<0.9,`expected plausible Wilder ATR, got ${x}`);
});

test("canonical technical engine returns the same scored contract needed by live and replay",()=>{
 const rows=[];let p=100;for(let i=0;i<260;i++){p*=1+(Math.sin(i/9)*.002+.0005);rows.push({datetime:`2020-${String(Math.floor(i/28)+1).padStart(2,"0")}-${String(i%28+1).padStart(2,"0")}`,open:p*.998,high:p*1.01,low:p*.99,close:p,volume:1_000_000+i*1000})}
 const x=computeTechnicalSnapshot(rows,rows,"SPY");
 assert.ok(x);
 assert.equal(typeof x.scores.timing,"number");
 assert.equal(typeof x.levels.invalidation,"number");
 assert.equal(x.indicatorVersion,"wilder-v1");
});
