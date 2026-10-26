const test=require("node:test"),assert=require("node:assert/strict"),E=require("./engine.js");
const mk=(n,f,hw=1,lw=1)=>{const c=Array.from({length:n},(_,i)=>f(i));return {t:c.map((_,i)=>"d"+i),o:c,h:c.map(x=>x+hw),l:c.map(x=>x-lw),c,v:c.map(()=>1000)};};
test("indicators match hand-computed reference values",()=>{
 const up=mk(400,i=>100+i);assert.equal(E.sma(up.c,50)[49],(100+149)/2);assert.equal(E.sma(up.c,5)[3],null);
 assert.equal(E.rsi(up.c)[300],100);assert.equal(E.rsi(mk(400,i=>500-i).c)[300],0);assert.equal(E.rsi(mk(100,()=>50).c)[50],50);
 assert.ok(Math.abs(E.atr(up.h,up.l,up.c)[300]-2)<1e-9);
 const ax=E.adx(up.h,up.l,up.c);assert.ok(ax.adx[300]>90);assert.ok(ax.plus[300]>ax.minus[300]);
 const e=E.ema([1,2,3,4,5,6,7,8,9,10],3);assert.equal(e[2],2);assert.equal(e[3],3);assert.equal(E.stoch(up.h,up.l,up.c)[300],100*(up.c[300]-(up.c[287]-1))/((up.c[300]+1)-(up.c[287]-1)));
 assert.equal(E.supertrend(up.h,up.l,up.c).dir[399],1);assert.equal(E.supertrend(mk(400,i=>500-i).h,mk(400,i=>500-i).l,mk(400,i=>500-i).c).dir[399],-1);
 assert.equal(E.obv([1,2,2,1],[10,10,10,10]).join(),"0,10,10,0");
});
test("the score never uses future data",()=>{
 const d=E.demo(900,3),S=E.build(d),all=E.scoreSeries(d,S).scores;
 for(const n of [500,650,800]){const cut={t:d.t.slice(0,n),o:d.o.slice(0,n),h:d.h.slice(0,n),l:d.l.slice(0,n),c:d.c.slice(0,n),v:d.v.slice(0,n)};const s2=E.scoreSeries(cut,E.build(cut)).scores;
  for(let i=200;i<n;i+=37)assert.equal(s2[i],all[i],"day "+i+" with "+n+" bars");}
});
test("steady rises score high and falls score low, within 0 to 100",()=>{
 const u=mk(500,i=>100+i*0.4),d=mk(500,i=>400-i*0.4);const su=E.scoreSeries(u,E.build(u)).scores.at(-1),sd=E.scoreSeries(d,E.build(d)).scores.at(-1);
 assert.ok(su>=60&&su<=100,String(su));assert.ok(sd<=40&&sd>=0,String(sd));assert.equal(E.scoreSeries(u,E.build(u)).scores[100],null);
 const f=E.factors(u,E.build(u),499);for(const k of Object.keys(f))assert.ok(f[k]>=-1&&f[k]<=1);
});
test("turning a factor off renormalizes the score and a missing volume factor is skipped",()=>{
 const f={trend:1,momentum:0,risk:0,volume:null};assert.equal(E.composite(f),50+50*0.35/0.85);assert.equal(E.composite(f,{trend:true}),50);assert.equal(E.composite({trend:1,momentum:1,risk:1,volume:1}),100);
 const nv=mk(500,i=>100+i*0.4);nv.v=nv.v.map(()=>0);const S=E.build(nv);assert.equal(S.hasVol,false);assert.equal(E.factors(nv,S,499).volume,null);
});
test("calibration keeps the first 60% and last 40% apart and reports no edge on noise",()=>{
 let none=0,total=0;for(const seed of [1,2,3,4,5,6]){let s=seed;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647};let p=100;const c=[];for(let i=0;i<1800;i++){p*=1+(rnd()-0.5)*0.03;c.push(p)}
  const d={t:c.map((_,i)=>"d"+i),o:c,h:c.map(x=>x*1.004),l:c.map(x=>x*0.996),c,v:c.map(()=>1)};const cal=E.calibrate(d,E.scoreSeries(d,E.build(d)).scores);assert.ok(cal);total++;
  assert.ok(["none","unstable","insufficient","consistent"].includes(cal.edge.status));if(cal.edge.status!=="consistent")none++;
  assert.ok(cal.train.top.n+cal.train.weak.n<=cal.train.base.n);}
 assert.ok(none>=total-1,"random walks should rarely look like a consistent edge: "+none+"/"+total);
 const d=E.demo(1600,7),S=E.build(d),cal=E.calibrate(d,E.scoreSeries(d,S).scores);assert.ok(cal.cut>d.t[200]);assert.equal(E.calibrate({c:[1],t:["a"]},[null]),null);
});
test("decisions follow the rules and large holdings are never told to add",()=>{
 const f={trend:0.8};const D=(o)=>E.decide({score:70,factors:f,rsi:60,extATR:1,owned:false,weight:0,edge:"consistent",...o});
 assert.equal(D({}).label,"Buy in stages");assert.equal(D({score:58}).label,"Buy a starter");assert.equal(D({score:48}).label,"Wait for confirmation");assert.equal(D({score:30}).label,"Avoid for now");
 assert.match(D({rsi:80}).label,/Do not chase/);assert.equal(D({owned:true,score:70}).label,"Hold or add on pullbacks");assert.match(D({owned:true,score:70,weight:30}).label,/Too large to add/);
 assert.equal(D({owned:true,score:35}).label,"Trim review");assert.equal(D({owned:true,score:20}).label,"Sell review");assert.match(D({edge:"none"}).reason,/has not separated/);assert.doesNotMatch(D({}).reason,/history/);
});
test("the risk plan sizes by risk and caps by position size",()=>{
 const p=E.plan({close:100,atr:2,stopLine:null,dir:-1,account:50000,riskPct:1,maxPct:20});assert.equal(p.stop,95);assert.equal(p.R,5);assert.equal(p.t1,110);assert.equal(p.t2,115);assert.equal(p.shares,100);assert.equal(p.capped,false);
 const q=E.plan({close:100,atr:2,stopLine:97,dir:1,account:50000,riskPct:1,maxPct:5});assert.equal(q.stop,97);assert.equal(q.shares,25);assert.equal(q.capped,true);
});
test("csv loading is forgiving, sorted, de-duplicated and refuses thin data",()=>{
 const rows=["Date,Open,High,Low,Close,Volume"];for(let i=320;i>=0;i--){const d=new Date(Date.UTC(2024,0,1)+i*86400000).toISOString().slice(0,10);rows.push(`${d},10,11,9,"${(10+i/10).toFixed(2)}","1,000"`);}rows.push(rows[1]);
 const d=E.parseCsv(rows.join("\n"));assert.equal(d.c.length,321);assert.ok(d.t[0]<d.t.at(-1));assert.equal(d.v[0],1000);
 assert.throws(()=>E.parseCsv("a,b\n1,2"),/Date and Close/);assert.throws(()=>E.parseCsv("Date,Close\n2024-01-01,5"),/at least 300/);
 const semi=["Date;Close"];for(let i=0;i<320;i++)semi.push(new Date(Date.UTC(2024,0,1)+i*86400000).toISOString().slice(0,10)+";"+(10+i/10).toFixed(2));assert.equal(E.parseCsv(semi.join("\n")).c.length,320);
});
