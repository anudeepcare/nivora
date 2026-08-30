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
BATCH=max(1,int(os.getenv("NIVORA_INVESTMENT_SCAN_BATCH_SIZE","12")))
PAUSE=max(0,float(os.getenv("NIVORA_INVESTMENT_SCAN_PAUSE_SECONDS","1.2")))
MIN_CAP=float(os.getenv("NIVORA_MIN_MARKET_CAP_M","750"))
TIMEOUT=15
sb=create_client(URL,SERVICE)

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

def analyze(sym,market=None):
    profile=get('stock/profile2',{'symbol':sym}) or {}
    cap=n(profile.get('marketCapitalization'))
    if cap<MIN_CAP:return None
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
    reason=(f"{round(quality)}/100 company quality; long-term thesis {state.lower()}. "
            f"Price action is only a confirmation/risk input, not the thesis.")
    main_risk='Valuation leaves limited margin of safety.' if valuation<40 else 'Forward growth needs stronger evidence.' if growth<45 else 'Near-term market risk is elevated.' if risk>=75 else 'Execution must continue to support the forward case.'
    evidence=sum([bool(m),bool(recs),bool(profile),tmean>0,market is not None])
    conf=round(clamp(42+evidence*10))
    return {'symbol':sym,'company_name':profile.get('name') or sym,'market_cap_m':round(cap,2),'company_score':round(quality),'growth_score':round(growth),'financial_score':round(financial),'analyst_score':round(analyst),'valuation_score':round(valuation),'thesis_score':thesis,'opportunity_score':opportunity,'thesis_label':label,'thesis_state':state,'action':action,'reason':reason,'main_risk':main_risk,'target_mean':round(tmean,2) if tmean>0 else None,'target_upside_pct':round(upside,1) if upside is not None else None,'price':round(price,2) if price>0 else None,'change_pct':round(chg,2),'evidence_confidence':conf,'scanned_at':datetime.now(timezone.utc).isoformat()}

def choose(universe,existing,batch):
    old={x['symbol']:x for x in existing};epoch=datetime(1970,1,1,tzinfo=timezone.utc)
    def key(x):
        r=old.get(x['symbol']);ts=epoch
        if r and r.get('scanned_at'):
            try:ts=datetime.fromisoformat(r['scanned_at'].replace('Z','+00:00'))
            except:pass
        return (0 if r is None else 1,ts,hashlib.sha1(('invest:'+x['symbol']).encode()).hexdigest())
    return [x['symbol'] for x in sorted(universe,key=key)[:batch]]

def main():
    universe=sb.table('nivora_market_universe').select('symbol').eq('active',True).execute().data or []
    existing=sb.table('nivora_investment_scan').select('symbol,scanned_at').execute().data or []
    syms=choose(universe,existing,min(BATCH,len(universe)))
    market_rows=sb.table('nivora_market_scan').select('symbol,price,change_pct,technical,risk_score').in_('symbol',syms).execute().data or []
    market={x['symbol']:x for x in market_rows};out=[]
    for i,s in enumerate(syms):
        try:
            x=analyze(s,market.get(s))
            if x:out.append(x)
        except Exception as e:print('skip',s,str(e)[:120])
        if i<len(syms)-1 and PAUSE:time.sleep(PAUSE)
    now=datetime.now(timezone.utc).isoformat()
    if out:
        old_rows=sb.table('nivora_investment_scan').select('symbol,thesis_score,action,changed_at,scanned_at').in_('symbol',[x['symbol'] for x in out]).execute().data or []
        old={x['symbol']:x for x in old_rows}
        for x in out:
            p=old.get(x['symbol']);x['previous_thesis_score']=p.get('thesis_score') if p else None;x['previous_action']=p.get('action') if p else None
            changed=(not p) or abs(n(p.get('thesis_score'))-x['thesis_score'])>=6 or p.get('action')!=x['action']
            x['changed_at']=now if changed else (p.get('changed_at') or p.get('scanned_at') if p else now)
        sb.table('nivora_investment_scan').upsert(out).execute()
    allrows=sb.table('nivora_investment_scan').select('symbol,scanned_at').execute().data or []
    cut=datetime.now(timezone.utc)-timedelta(hours=48)
    fresh=sum(1 for x in allrows if x.get('scanned_at') and datetime.fromisoformat(x['scanned_at'].replace('Z','+00:00'))>=cut)
    sb.table('nivora_scan_state').update({'investment_scanned_count':len(allrows),'investment_fresh_count':fresh,'last_investment_scan_at':now}).eq('id',1).execute()
    print({'ok':True,'requested':len(syms),'stored':len(out),'investmentScanned':len(allrows),'fresh48h':fresh})
if __name__=='__main__':main()
