#!/usr/bin/env python3
"""NIVORA V45 rolling US-market scanner.

Purpose:
- Synchronize the supported US common-stock universe from Twelve Data.
- Scan a rotating batch of symbols each run using daily OHLCV.
- Persist validated entry/target/risk geometry for Discover/Today.

This is a market pre-screen, not a promise of returns. Full NIVORA company/news/
smart-money evidence can be inspected after a candidate is surfaced.
"""
import os, math, time, json, requests, hashlib, re
from datetime import datetime, timezone
from supabase import create_client

TD=os.environ["TWELVE_DATA_API_KEY"]
URL=os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BATCH=max(1,int(os.getenv("NIVORA_SCAN_BATCH_SIZE","24")))
SYNC_UNIVERSE=os.getenv("NIVORA_SYNC_UNIVERSE","1")!="0"
TIMEOUT=25
sb=create_client(URL,SERVICE)

def clamp(x,a=0,b=100): return max(a,min(b,x))
def rnd(x,d=2): return round(float(x),d)
def sma(xs,n):
    if not xs:return 0
    q=xs[-min(n,len(xs)):];return sum(q)/len(q)
def ema(xs,n):
    if not xs:return []
    k=2/(n+1); out=[xs[0]]
    for x in xs[1:]:out.append(x*k+out[-1]*(1-k))
    return out
def rsi(xs,n=14):
    if len(xs)<n+1:return 50
    ds=[xs[i]-xs[i-1] for i in range(1,len(xs))][-n:]
    g=sum(max(x,0) for x in ds)/n;l=sum(max(-x,0) for x in ds)/n
    return 100 if l==0 else 100-(100/(1+g/l))
def atr(rows,n=14):
    if len(rows)<2:return 0
    trs=[]
    for i in range(1,len(rows)):
        h=float(rows[i]['high']);l=float(rows[i]['low']);pc=float(rows[i-1]['close'])
        trs.append(max(h-l,abs(h-pc),abs(l-pc)))
    return sma(trs,n)
def macd_hist(xs):
    a=ema(xs,12);b=ema(xs,26);m=[x-y for x,y in zip(a,b)];sig=ema(m,9)
    return (m[-1]-sig[-1]) if m and sig else 0

def sync_universe():
    r=requests.get("https://api.twelvedata.com/stocks",params={"country":"United States","format":"JSON","apikey":TD},timeout=TIMEOUT)
    r.raise_for_status();j=r.json();rows=j.get("data") or []
    allowed={"Common Stock","American Depositary Receipt","Depositary Receipt","REIT"}
    out=[]
    for x in rows:
        typ=x.get("type") or ""
        ex=(x.get("exchange") or "").upper()
        sym=(x.get("symbol") or "").upper().strip()
        if not sym or "/" in sym or ex not in {"NASDAQ","NYSE","AMEX","NYSE ARCA","CBOE"}:continue
        # Default Discover is an investable-equity universe, not every listed security.
        # Reject warrants, units, rights, preferred-like suffixes and unknown instrument types.
        if typ not in allowed:continue
        if re.search(r"(?:\.W|\.WS|\.WT|\.U|\.UN|\.R|\.RT|\.P[A-Z]?)$", sym):continue
        if sym.endswith(("-WS","-WT","-W","-U","-R")):continue
        out.append({"symbol":sym,"name":x.get("name") or x.get("instrument_name"),"exchange":ex,"instrument_type":typ,"currency":x.get("currency"),"country":x.get("country") or "United States","active":True,"updated_at":datetime.now(timezone.utc).isoformat()})
    # Deduplicate and upsert in chunks.
    by={x['symbol']:x for x in out};vals=list(by.values())
    for i in range(0,len(vals),500):sb.table("nivora_market_universe").upsert(vals[i:i+500]).execute()
    sb.table("nivora_scan_state").update({"universe_count":len(vals),"last_universe_sync":datetime.now(timezone.utc).isoformat(),"last_error":None}).eq("id",1).execute()
    return len(vals)

def analyze(symbol):
    r=requests.get("https://api.twelvedata.com/time_series",params={"symbol":symbol,"interval":"1day","outputsize":140,"apikey":TD},timeout=TIMEOUT)
    j=r.json();vals=j.get("values")
    if not vals:return None
    rows=list(reversed(vals)); c=[float(x['close']) for x in rows];h=[float(x['high']) for x in rows];l=[float(x['low']) for x in rows];v=[float(x.get('volume') or 0) for x in rows]
    if len(c)<55:return None
    p=c[-1];e20=ema(c,20)[-1];e50=ema(c,50)[-1];rv=rsi(c);a=max(.01,atr(rows));ret5=p/(c[-6] if len(c)>5 else p)-1;ret20=p/(c[-21] if len(c)>20 else p)-1
    avg_vol20=sma(v,20); avg_dollar_vol20=avg_vol20*p
    # Keep the default opportunity board investable and reduce penny/illiquid noise.
    # These are pre-screen thresholds, not claims about company quality.
    min_price=float(os.getenv("NIVORA_MIN_PRICE","3"))
    min_dollar_vol=float(os.getenv("NIVORA_MIN_DOLLAR_VOLUME","2000000"))
    if p < min_price or avg_dollar_vol20 < min_dollar_vol:return None
    vr=(sma(v[-5:],5)/avg_vol20) if avg_vol20 else 1
    trend=clamp(50+(14 if p>e20 else -14)+(16 if e20>e50 else -16)+ret20*110,5,95)
    momentum=clamp(50+(rv-50)*.7+ret5*100+(10 if macd_hist(c)>0 else -10),5,95)
    flow=clamp(50+(vr-1)*35+(8 if ret5>0 else -6),5,95)
    ext=clamp((abs(p-e20)/a)*28,5,95);technical=round(trend*.35+momentum*.27+flow*.20+(100-ext)*.18);risk=clamp(25+(a/p)*600+ext*.30,10,95);entry=clamp(technical*.55+(100-risk)*.22+(15 if 38<=rv<=68 else -12 if rv>75 else 0)+(8 if p<=e20*1.035 else -4),5,95);score=round(technical*.58+entry*.27+(100-risk)*.15)
    low30=min(l[-30:]);high30=max(h[-30:]);elo=max(low30,e20-a*.75);ehi=min(p,e20+a*.20)
    if elo>ehi:elo,ehi=ehi,elo
    mid=(elo+ehi)/2;stop=min(low30-a*.35,e50-a*.9,mid-a*.75);t1=max(high30,p+a*1.7,mid+a*1.4);t2=max(t1+a*1.25,p+a*3)
    geom=stop>0 and stop<mid and t1>mid and ((mid-stop)/mid)>=.004
    rr=((t1-mid)/(mid-stop)) if geom else None
    if rr is not None and (not math.isfinite(rr) or rr<=0 or rr>12):geom=False;rr=None
    conf=round(clamp(48+abs(technical-50)*.30+min(20,abs(ret20)*100)+min(12,max(0,vr-1)*16),45,91))
    if risk>=86 or (trend<30 and momentum<38) or score<34:action="AVOID / EXIT WATCH"
    elif ext>=84 and trend>=60:action="DON'T CHASE"
    elif geom and score>=80 and entry>=66 and risk<70 and trend>=58 and momentum>=52 and flow>=45 and rr>=1.35:action="BUY / START"
    elif geom and score>=72 and entry>=58 and risk<76 and trend>=55 and rr>=1.2:action="START / PULLBACK"
    elif trend>=68 and momentum>=60 and flow>=52 and ext<72:action="WATCH BREAKOUT"
    elif score>=64 and entry>=52:action="WATCH ENTRY"
    elif score>=54:action="WAIT"
    else:action="AVOID"
    if action in {"BUY / START","START / PULLBACK"}:cat="Best now"
    elif "EXIT" in action or action=="AVOID":cat="Exit watch"
    elif trend>=66 and momentum>=60 and ext<66:cat="Early momentum"
    elif trend>=60 and p<=e20*1.035:cat="Quality pullback"
    elif flow>=64 and momentum>=58:cat="In play"
    else:cat="Watch"
    rrscore=clamp((rr-1)*28+50,20,92) if geom and rr is not None else 30
    rank=round(clamp(score*.38+conf*.14+entry*.14+(100-risk)*.10+trend*.08+momentum*.06+flow*.04+rrscore*.06-(10 if ext>82 else 0)-(0 if geom else 12),0,100))
    reason="Timing, trend and validated reward/risk are aligned." if action=="BUY / START" else "Constructive setup near a risk-defined entry area." if action=="START / PULLBACK" else "Risk and weak structure outweigh the current setup." if ("EXIT" in action or action=="AVOID") else "Setup is developing but still needs stronger confirmation."
    return {"symbol":symbol,"price":rnd(p),"change_pct":rnd((p/c[-2]-1)*100),"score":score,"rank_score":rank,"confidence":conf,"technical":technical,"entry_score":round(entry),"risk_score":round(risk),"trend":round(trend),"momentum":round(momentum),"flow":round(flow),"extension":round(ext),"action":action,"category":cat,"reason":reason,"entry_low":rnd(elo),"entry_high":rnd(ehi),"target_1":rnd(t1),"target_2":rnd(t2),"thesis_break":rnd(stop),"reward_risk":rnd(rr) if rr is not None else None,"geometry_valid":geom,"geometry_reason":None if geom else "Invalid or unstable price geometry","scanned_at":datetime.now(timezone.utc).isoformat()}

def main():
    try:
        st=sb.table("nivora_scan_state").select("*").eq("id",1).single().execute().data or {}
        if SYNC_UNIVERSE and (not st.get('last_universe_sync') or (datetime.now(timezone.utc)-datetime.fromisoformat(st['last_universe_sync'].replace('Z','+00:00'))).total_seconds()>86400):sync_universe()
        rows=sb.table("nivora_market_universe").select("symbol").eq("active",True).execute().data or []
        if not rows:raise RuntimeError("Market universe is empty. Run the V45/V46 migration and universe sync first.")
        # Stable hash order prevents the warm-up screen from looking alphabetically biased
        # while still guaranteeing every eligible symbol is eventually visited.
        rows.sort(key=lambda x: hashlib.sha1(x['symbol'].encode()).hexdigest())
        cursor=int(st.get('cursor') or 0)%len(rows);symbols=[rows[(cursor+i)%len(rows)]['symbol'] for i in range(min(BATCH,len(rows)))]
        ok=[]
        for i,sym in enumerate(symbols):
            try:
                x=analyze(sym)
                if x:ok.append(x)
            except Exception as e:print("skip",sym,str(e)[:120])
            # Keep default safe for low-credit plans; reduce via env on higher plans.
            pause=float(os.getenv("NIVORA_SCAN_PAUSE_SECONDS","8"))
            if i<len(symbols)-1 and pause>0:time.sleep(pause)
        if ok:
            now_iso=datetime.now(timezone.utc).isoformat()
            syms=[x["symbol"] for x in ok]
            old_rows=sb.table("nivora_market_scan").select("symbol,action,rank_score,scanned_at,changed_at").in_("symbol",syms).execute().data or []
            old={x["symbol"]:x for x in old_rows}
            for x in ok:
                prev=old.get(x["symbol"])
                x["previous_action"]=prev.get("action") if prev else None
                x["previous_rank_score"]=prev.get("rank_score") if prev else None
                materially_changed=(not prev) or prev.get("action")!=x["action"] or abs(float(prev.get("rank_score") or 0)-float(x["rank_score"]))>=6
                x["changed_at"]=now_iso if materially_changed else (prev.get("changed_at") or prev.get("scanned_at") if prev else now_iso)
            for i in range(0,len(ok),200):sb.table("nivora_market_scan").upsert(ok[i:i+200]).execute()
        new_cursor=(cursor+len(symbols))%len(rows)
        sb.table("nivora_scan_state").update({"cursor":new_cursor,"universe_count":len(rows),"last_scan_at":datetime.now(timezone.utc).isoformat(),"last_batch_size":len(ok),"last_error":None}).eq("id",1).execute()
        print(json.dumps({"ok":True,"universe":len(rows),"batch":len(symbols),"stored":len(ok),"nextCursor":new_cursor}))
    except Exception as e:
        try:sb.table("nivora_scan_state").update({"last_error":str(e)[:500]}).eq("id",1).execute()
        except Exception:pass
        raise
if __name__=="__main__":main()
