import json, statistics as st, collections
R=[r for i in range(4) for r in json.load(open(f"/home/claude/market/out/c{i}.json"))]
# fields: 0 q,1 lvl,2 r12,3 r6,4 month,5 dd,6 >50,7 >200,8 mom63,9 mom12-1,10 off63low,11 growth,12 margin,13 golden
by=collections.defaultdict(list)
for r in R:
    if r[2] is not None: by[r[4]].append(r[2])
med={k:st.median(v) for k,v in by.items()}
by6=collections.defaultdict(list)
for r in R: by6[r[4]].append(r[3])
med6={k:st.median(v) for k,v in by6.items()}
def show(name, rows):
    a=[r[2] for r in rows if r[2] is not None]; b=[r[3] for r in rows]
    if len(a)<150: print(f"{name:58s} n={len(a)} (too few)"); return
    ex=[r[2]-med[r[4]] for r in rows if r[2] is not None]
    ex6=[r[3]-med6[r[4]] for r in rows]
    months=len({r[4] for r in rows if r[2] is not None})
    print(f"{name:58s} n={len(a):6d} 12m med {st.median(a)*100:+6.1f}% win {sum(x>0 for x in a)/len(a)*100:4.1f}% p10 {sorted(a)[len(a)//10]*100:+6.1f}% beatMkt {sum(x>0 for x in ex)/len(ex)*100:4.1f}% exMed {st.median(ex)*100:+5.1f}% | 6m win {sum(x>0 for x in b)/len(b)*100:4.1f}% beat {sum(x>0 for x in ex6)/len(ex6)*100:4.1f}%")
P=[r for r in R if r[0]==2]; M=[r for r in R if r[0]==1]; F=[r for r in R if r[0]==0]
print("rows",len(R),"pass",len(P),"mixed",len(M),"fail",len(F))
show("ALL stocks",R); show("PASS all months",P); show("MIXED all",M); show("FAIL all",F)
print("--- within PASS")
show("uptrend (>200d)",[r for r in P if r[7]]); show("downtrend (<200d)",[r for r in P if not r[7]])
show("golden (50>200)",[r for r in P if r[13]]); show("mom12-1 > 0",[r for r in P if r[9]>0]); show("mom12-1 > 20",[r for r in P if r[9]>20]); show("mom12-1 < 0",[r for r in P if r[9]<=0])
for lo,hi in ((0,5),(5,15),(15,30),(30,50),(50,101)): show(f"drawdown {lo}-{hi}% from 1y high",[r for r in P if lo<=r[5]<hi])
show("pullback 10-30% & >200d",[r for r in P if 10<=r[5]<30 and r[7]]); show("pullback 10-30% & <200d",[r for r in P if 10<=r[5]<30 and not r[7]])
show("pullback >=20% & >50d (recovering)",[r for r in P if r[5]>=20 and r[6]]); show("pullback >=20% & <50d (still falling)",[r for r in P if r[5]>=20 and not r[6]])
show("pullback >=20% & up>15% off 3m low",[r for r in P if r[5]>=20 and r[10]>15]); show("pullback>=20% & mom12-1>0",[r for r in P if r[5]>=20 and r[9]>0])
show("P2-4 & >50d",[r for r in P if r[1]>=2 and r[6]]); show("P2-4 & <50d",[r for r in P if r[1]>=2 and not r[6]])
show("growth>=15% ",[r for r in P if r[11] is not None and r[11]>=15]); show("growth>=15% & >200d",[r for r in P if r[11] is not None and r[11]>=15 and r[7]]); show("margin>=20%",[r for r in P if r[12] is not None and r[12]>=20]); show("growth>=15 & margin>=15 & >200d",[r for r in P if r[11] is not None and r[11]>=15 and r[12] is not None and r[12]>=15 and r[7]])
show("near high (<5%) & >200d",[r for r in P if r[5]<5 and r[7]])
print("--- sell-side evidence")
show("PASS stretched: P0",[r for r in P if r[1]==0]); show("PASS >40% above 3m low",[r for r in P if r[10]>40])
show("FAIL & downtrend",[r for r in F if not r[7]]); show("FAIL & uptrend",[r for r in F if r[7]]); show("MIXED & downtrend",[r for r in M if not r[7]]); show("PASS & mom12-1< -20",[r for r in P if r[9]<-20])
print("--- stability by year (PASS uptrend vs PASS downtrend win12)")
for y in ("2022","2023","2024","2025"):
    for nm,rows in (("up",[r for r in P if r[7] and r[4][:4]==y]),("down",[r for r in P if not r[7] and r[4][:4]==y]),("fail",[r for r in F if r[4][:4]==y])):
        a=[r[2] for r in rows if r[2] is not None]
        if len(a)>100: print(f"  {y} {nm:5s} n={len(a):5d} win {sum(x>0 for x in a)/len(a)*100:4.1f}% med {st.median(a)*100:+5.1f}% beatMkt {sum(r[2]>med[r[4]] for r in rows if r[2] is not None)/len(a)*100:4.1f}%")
