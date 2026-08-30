#!/usr/bin/env python3
"""NIVORA V48 thesis-first investment scanner.

Purpose: build a persistent, long-horizon research universe independently of the
short-term technical scanner. Price action is a small confirmation/risk input;
it does not define company quality or the investment thesis.

This is decision-support research, not an execution engine.
"""
import os,time,math,hashlib,requests
from datetime import datetime,timezone,timedelta
from supabase import create_client

FH=os.environ["FINNHUB_API_KEY"]
URL=os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BATCH=max(1,int(os.getenv("NIVORA_INVESTMENT_SCAN_BATCH_SIZE","28")))
PAUSE=max(0,float(os.getenv("NIVORA_INVESTMENT_SCAN_PAUSE_SECONDS","1.2")))
MIN_CAP=float(os.getenv("NIVORA_MIN_MARKET_CAP_M","750"))
TIMEOUT=15
sb=create_client(URL,SERVICE)

# Liquid research seeds make a new install useful immediately. User portfolio/watchlist
# symbols are discovered privately from Supabase and receive higher priority than these.
CORE_RESEARCH_SEED=[
    "AAPL","MSFT","NVDA","AMZN","GOOGL","META","AVGO","AMD","TSLA","NFLX",
    "APP","TTD","IREN","HIMS","ZETA","SOFI","OSCR","NOW","PYPL","GRAB","CRWD",
    "PLTR","MU","UBER","HOOD","COIN","SHOP","SNOW","DDOG","NET","CELH","BE"
]

def clamp(x,a=0,b=100):return max(a,min(b,float(x)))
def n(x,d=0):
    try:
        y=float(x);return y if math.isfinite(y) else d
    except:return d

def get(path,params):
    p=dict(params);p['token']=FH
    r=requests.get('https://finnhub.io/api/v1/'+path,params=p,timeout=TIMEOUT)
    r.raise_for_status();return r.json()

def metric(m,*keys):
    for k in keys:
        if k in m and m[k] is not None:return n(m[k],0)
    return 0

def analyst_score(recs):
    if not recs:return 50,0
    r=recs[0];sbuy=n(r.get('strongBuy'));buy=n(r.get('buy'));hold=n(r.get('hold'));sell=n(r.get('sell'));ss=n(r.get('strongSell'));tot=sbuy+buy+hold+sell+ss
    if not tot:return 50,0
    return round(clamp((sbuy*100+buy*80+hold*50+sell*20+ss*5)/tot)),int(tot)

def analyze(sym,market=None,priority=False):
    profile=get('stock/profile2',{'symbol':sym}) or {}
    cap=n(profile.get('marketCapitalization'))
    if cap<(max(100,MIN_CAP*.15) if priority else MIN_CAP):return None
    basic=get('stock/metric',{'symbol':sym,'metric':'all'}) or {};m=basic.get('metric') or {}
    recs=get('stock/recommendation',{'symbol':sym}) or []
    target=get('stock/price-target',{'symbol':sym}) or {}
    price=n((market or {}).get('price'))
    if price<=0:price=metric(m,'currentRatioQuarterly')*0 # keep zero; target opportunity will be neutral

    rev=metric(m,'revenueGrowthTTMYoy','revenueGrowth3Y','revenueGrowth5Y')
    eps=metric(m,'epsGrowthTTMYoy','epsGrowth3Y','epsGrowth5Y')
    margin=metric(m,'netProfitMarginTTM','netProfitMarginAnnual')
    roe=metric(m,'roeTTM','roeAnnual')
    current=metric(m,'currentRatioQuarterly','currentRatioAnnual')
    debt=metric(m,'totalDebt/totalEquityQuarterly','totalDebt/totalEquityAnnual')
    pe=metric(m,'peTTM','peNormalizedAnnual','peBasicExclExtraTTM')
    fcfps=metric(m,'freeCashFlowPerShareTTM','freeCashFlowPerShareAnnual')

    growth=clamp(50+max(-22,min(28,rev*.72))+max(-15,min(18,eps*.24)))
    profitability=clamp(50+max(-18,min(20,margin*.85))+max(-12,min(16,(roe-8)*.42))+(7 if fcfps>0 else -7 if fcfps<0 else 0))
    balance=50+(8 if current>=1.5 else -8 if current and current<1 else 0)+(10 if debt and debt<60 else -10 if debt>150 else 0)
    financial=clamp(profitability*.62+clamp(balance)*.38)
    quality=clamp(growth*.25+financial*.55+(65 if cap>=10000 else 58 if cap>=3000 else 52)*.20)
    analyst,analyst_n=analyst_score(recs)

    tmean=n(target.get('targetMean'));upside=((tmean/price)-1)*100 if price>0 and tmean>0 else None
    val_from_pe=50 if pe<=0 else 76 if pe<15 else 68 if pe<25 else 56 if pe<40 else 43 if pe<65 else 30
    if rev>20:val_from_pe+=7
    valuation=clamp(val_from_pe*.60+(clamp(50+(upside or 0)*1.1) if upside is not None else 50)*.40)

    technical=n((market or {}).get('technical'),50);risk=n((market or {}).get('risk_score'),60);chg=n((market or {}).get('change_pct'),0)
    thesis=round(clamp(quality*.40+growth*.23+financial*.17+analyst*.12+technical*.08))
    forward_delta=(growth-50)*.45+(analyst-50)*.18+(financial-50)*.18
    state='Strengthening' if forward_delta>=8 else 'Weakening' if forward_delta<=-8 else 'Intact' if thesis>=61 else 'Mixed'
    label='BULLISH' if thesis>=67 else 'BEARISH' if thesis<=44 else 'NEUTRAL'
    opportunity=round(clamp(thesis*.55+valuation*.27+(100-risk)*.10+technical*.08))
    if label=='BEARISH' and thesis<34:action='AVOID'
    elif state=='Weakening' and thesis<52:action='REDUCE / WATCH'
    elif thesis>=80 and opportunity>=80:action='STRONG BUY OPPORTUNITY'
    elif thesis>=68 and opportunity>=68:action='ACCUMULATE'
    elif thesis>=58:action='HOLD / WATCH'
    else:action='WATCH'
    # Horizon scores deliberately use different evidence. A stock can be weak in 3M and
    # attractive in 3Y; price action is never allowed to rewrite the durable thesis alone.
    h3m=round(clamp(technical*.28+analyst*.16+growth*.12+financial*.08+valuation*.08+(100-risk)*.18+(50+chg)*.10))
    h6m=round(clamp(thesis*.32+growth*.18+analyst*.14+valuation*.14+financial*.10+technical*.06+(100-risk)*.06))
    h1y=round(clamp(thesis*.40+growth*.20+financial*.13+analyst*.10+valuation*.13+(100-risk)*.04))
    h2y=round(clamp(quality*.30+growth*.24+financial*.18+thesis*.20+valuation*.08))
    h3y=round(clamp(quality*.34+growth*.28+financial*.22+thesis*.16))
    reason=(f"{round(quality)}/100 company quality; long-term thesis {state.lower()}. "
            f"Price action is only a confirmation/risk input, not the thesis.")
    main_risk='Valuation leaves limited margin of safety.' if valuation<40 else 'Forward growth needs stronger evidence.' if growth<45 else 'Near-term market risk is elevated.' if risk>=75 else 'Execution must continue to support the forward case.'
    evidence=sum([bool(m),bool(recs),bool(profile),tmean>0,market is not None])
    conf=round(clamp(42+evidence*10))
    return {'symbol':sym,'company_name':profile.get('name') or sym,'market_cap_m':round(cap,2),'company_score':round(quality),'growth_score':round(growth),'financial_score':round(financial),'analyst_score':round(analyst),'valuation_score':round(valuation),'thesis_score':thesis,'opportunity_score':opportunity,'thesis_label':label,'thesis_state':state,'action':action,'reason':reason,'main_risk':main_risk,'target_mean':round(tmean,2) if tmean>0 else None,'target_upside_pct':round(upside,1) if upside is not None else None,'price':round(price,2) if price>0 else None,'change_pct':round(chg,2),'evidence_confidence':conf,'horizon_3m':h3m,'horizon_6m':h6m,'horizon_1y':h1y,'horizon_2y':h2y,'horizon_3y':h3y,'scanned_at':datetime.now(timezone.utc).isoformat()}

def private_priority_symbols():
    """Prioritize symbols users explicitly care about without exposing private holdings client-side."""
    out=[]
    for table in ('portfolio_positions','watchlist_items'):
        try:
            rows=sb.table(table).select('symbol').execute().data or []
            out.extend((x.get('symbol') or '').upper().strip() for x in rows)
        except Exception as e:
            print('priority source unavailable',table,str(e)[:80])
    # Keep first occurrence. Core seeds are public research candidates, not claimed holdings.
    return list(dict.fromkeys([x for x in out+CORE_RESEARCH_SEED if x]))

def choose(universe,existing,batch):
    old={x['symbol']:x for x in existing};epoch=datetime(1970,1,1,tzinfo=timezone.utc)
    universe_set={x['symbol'] for x in universe};priority=[x for x in private_priority_symbols() if x in universe_set]
    now=datetime.now(timezone.utc)
    def ts(sym):
        r=old.get(sym);v=epoch
        if r and r.get('scanned_at'):
            try:v=datetime.fromisoformat(r['scanned_at'].replace('Z','+00:00'))
            except:pass
        return v
    # Portfolio/watchlist names stay warm (target <=6h), then stale/never-scanned market names.
    hot=[x for x in priority if (now-ts(x)).total_seconds()>=6*3600]
    hot=sorted(hot,key=lambda x:(ts(x),hashlib.sha1(('hot:'+x).encode()).hexdigest()))
    rest=[x['symbol'] for x in universe if x['symbol'] not in set(hot)]
    rest=sorted(rest,key=lambda sym:(0 if sym not in old else 1,ts(sym),hashlib.sha1(('invest:'+sym).encode()).hexdigest()))
    return (hot+rest)[:batch],set(priority)

def grade_prior_calls(symbol,current_price):
    """Forward-grade old frozen calls when this symbol is refreshed. No hindsight edits."""
    if not current_price or current_price<=0:return
    try:
        rows=sb.table('nivora_decision_history').select('id,observed_at,price').eq('symbol',symbol).order('observed_at',desc=False).execute().data or []
        now=datetime.now(timezone.utc)
        horizons=(1,7,30,90,180,365)
        for h in rows:
            sp=n(h.get('price'),0)
            if sp<=0 or not h.get('observed_at'):continue
            observed=datetime.fromisoformat(h['observed_at'].replace('Z','+00:00'))
            age=(now-observed).total_seconds()/86400
            for days in horizons:
                if age<days:continue
                try:
                    sb.table('nivora_decision_outcomes').upsert({'history_id':h['id'],'symbol':symbol,'horizon_days':days,'evaluated_at':now.isoformat(),'start_price':sp,'end_price':current_price,'return_pct':round((current_price/sp-1)*100,3)},{'on_conflict':'history_id,horizon_days'}).execute()
                except Exception as e:print('outcome skip',symbol,days,str(e)[:80])
    except Exception as e:print('grade skip',symbol,str(e)[:100])

def record_history(rows):
    """Append immutable research observations. At most one routine snapshot/symbol/day, but always record material changes."""
    now=datetime.now(timezone.utc)
    for x in rows:
        try:
            q=sb.table('nivora_decision_history').select('observed_at,thesis_score,action').eq('symbol',x['symbol']).order('observed_at',desc=True).limit(1).execute().data or []
            prev=q[0] if q else None
            last=None
            if prev and prev.get('observed_at'):
                last=datetime.fromisoformat(prev['observed_at'].replace('Z','+00:00'))
            material=(not prev) or prev.get('action')!=x.get('action') or abs(n(prev.get('thesis_score'))-n(x.get('thesis_score')))>=5
            if last and not material and last.date()==now.date():
                continue
            row={k:x.get(k) for k in ['symbol','price','company_score','growth_score','financial_score','analyst_score','valuation_score','thesis_score','opportunity_score','evidence_confidence','thesis_label','thesis_state','action','horizon_3m','horizon_6m','horizon_1y','horizon_2y','horizon_3y','reason','main_risk']}
            row['observed_at']=now.isoformat();row['source_snapshot']={'change_pct':x.get('change_pct'),'target_mean':x.get('target_mean'),'target_upside_pct':x.get('target_upside_pct'),'priority_source':x.get('priority_source')}
            sb.table('nivora_decision_history').insert(row).execute()
        except Exception as e:print('history skip',x['symbol'],str(e)[:100])

def main():
    universe=sb.table('nivora_market_universe').select('symbol').eq('active',True).execute().data or []
    existing=sb.table('nivora_investment_scan').select('symbol,scanned_at').execute().data or []
    syms,priority=choose(universe,existing,min(BATCH,len(universe)))
    market_rows=sb.table('nivora_market_scan').select('symbol,price,change_pct,technical,risk_score').in_('symbol',syms).execute().data or []
    market={x['symbol']:x for x in market_rows};out=[]
    for i,sym in enumerate(syms):
        try:
            x=analyze(sym,market.get(sym),sym in priority)
            if x:
                x['priority_source']='portfolio/watchlist/seed' if sym in priority else 'market'
                out.append(x)
        except Exception as e:print('skip',sym,str(e)[:120])
        if i<len(syms)-1 and PAUSE:time.sleep(PAUSE)
    now=datetime.now(timezone.utc).isoformat()
    if out:
        old_rows=sb.table('nivora_investment_scan').select('symbol,thesis_score,action,changed_at,scanned_at').in_('symbol',[x['symbol'] for x in out]).execute().data or []
        old={x['symbol']:x for x in old_rows}
        for x in out:
            p=old.get(x['symbol']);x['previous_thesis_score']=p.get('thesis_score') if p else None;x['previous_action']=p.get('action') if p else None
            changed=(not p) or abs(n(p.get('thesis_score'))-x['thesis_score'])>=5 or p.get('action')!=x['action']
            x['changed_at']=now if changed else (p.get('changed_at') or p.get('scanned_at') if p else now)
        sb.table('nivora_investment_scan').upsert(out).execute();record_history(out)
        for x in out: grade_prior_calls(x['symbol'],n(x.get('price'),0))
    allrows=sb.table('nivora_investment_scan').select('symbol,scanned_at').execute().data or []
    cut=datetime.now(timezone.utc)-timedelta(hours=48)
    fresh=sum(1 for x in allrows if x.get('scanned_at') and datetime.fromisoformat(x['scanned_at'].replace('Z','+00:00'))>=cut)
    sb.table('nivora_scan_state').update({'investment_scanned_count':len(allrows),'investment_fresh_count':fresh,'last_investment_scan_at':now}).eq('id',1).execute()
    print({'ok':True,'requested':len(syms),'stored':len(out),'priorityRequested':sum(1 for s in syms if s in priority),'investmentScanned':len(allrows),'fresh48h':fresh})
if __name__=='__main__':main()
