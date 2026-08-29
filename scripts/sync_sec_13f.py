#!/usr/bin/env python3
"""
NIVORA SEC Form 13F cache builder.

Downloads two official SEC quarterly Form 13F structured-data ZIPs, aggregates
reported manager holdings by public-company ticker using normalized SEC issuer
names, compares manager holdings quarter-over-quarter, and upserts snapshots
into Supabase.

This is filing intelligence, NOT real-time institutional order flow.
"""
import csv, io, json, os, re, sys, urllib.request, zipfile
from collections import defaultdict
from datetime import datetime

DATA_PAGE="https://www.sec.gov/data-research/sec-markets-data/form-13f-data-sets"
TICKERS="https://www.sec.gov/files/company_tickers.json"
UA=os.getenv("SEC_USER_AGENT") or "NIVORA market-research app (set SEC_USER_AGENT with a contact email)"
LATEST=os.getenv("SEC_13F_LATEST_URL") or ""
PREVIOUS=os.getenv("SEC_13F_PREVIOUS_URL") or ""
SUPABASE_URL=os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
SERVICE=os.environ["SUPABASE_SERVICE_ROLE_KEY"]

DROP={"INC","INCORPORATED","CORP","CORPORATION","CO","COMPANY","PLC","LTD","LIMITED","DEL","DE","NEW","CLASS","CL"}

def get(url):
    req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept-Encoding":"identity"})
    with urllib.request.urlopen(req,timeout=120) as r:return r.read()

def norm(x):
    x=re.sub(r"[^A-Z0-9 ]+"," ",str(x).upper())
    words=[w for w in x.split() if w not in DROP]
    return " ".join(words).strip()

def discover_urls():
    from urllib.parse import urljoin
    html=get(DATA_PAGE).decode("utf-8","replace")
    links=re.findall(r'href=["\']([^"\']+form13f\.zip)["\']',html,re.I)
    links=[urljoin(DATA_PAGE,x) for x in links]
    # SEC lists newest first.
    unique=[]
    for x in links:
        if x not in unique: unique.append(x)
    if len(unique)<2: raise RuntimeError("Could not discover the latest two SEC 13F data-set ZIPs")
    return unique[0],unique[1]

def load_tickers():
    raw=json.loads(get(TICKERS))
    out={}
    for _,v in raw.items():
        title=v.get("title",""); sym=str(v.get("ticker","")).upper()
        n=norm(title)
        if n and sym:
            out.setdefault(n,[]).append((sym,title))
    return out

def find_member(z,names):
    lowered={n.lower():n for n in z.namelist()}
    for wanted in names:
        for low,real in lowered.items():
            if low.endswith(wanted.lower()):return real
    raise RuntimeError("Missing expected 13F table: "+"/".join(names))

def read_tsv(z,member):
    f=io.TextIOWrapper(z.open(member),"utf-8-sig",errors="replace",newline="")
    yield from csv.DictReader(f,delimiter="\t")

def quarter(url,ticker_map):
    blob=get(url)
    z=zipfile.ZipFile(io.BytesIO(blob))
    cover=find_member(z,["coverpage.tsv"])
    info=find_member(z,["infotable.tsv"])
    manager={}
    report_period={}
    for r in read_tsv(z,cover):
        acc=r.get("ACCESSION_NUMBER","")
        manager[acc]=r.get("FILINGMANAGER_NAME","") or r.get("NAME","") or acc
        report_period[acc]=r.get("REPORTCALENDARORQUARTER","") or r.get("PERIODOFREPORT","")
    # symbol -> manager -> aggregate
    agg=defaultdict(lambda:defaultdict(lambda:{"shares":0.0,"value":0.0,"issuer":"","filingDate":None}))
    matched=0
    for r in read_tsv(z,info):
        issuer=r.get("NAMEOFISSUER","")
        matches=ticker_map.get(norm(issuer))
        if not matches or len(matches)!=1: continue
        sym,title=matches[0]
        # Ignore option rows; ownership trend should reflect reported equity holdings.
        if str(r.get("PUTCALL","")).strip(): continue
        acc=r.get("ACCESSION_NUMBER","")
        mgr=manager.get(acc,acc or "Reporting manager")
        try: shares=float(r.get("SSHPRNAMT") or 0)
        except: shares=0.0
        try: value=float(r.get("VALUE") or 0)
        except: value=0.0
        a=agg[sym][mgr]; a["shares"]+=shares; a["value"]+=value; a["issuer"]=issuer
        a["filingDate"]=report_period.get(acc)
        matched+=1
    print("matched rows",matched,"symbols",len(agg),file=sys.stderr)
    return agg

def period_from_url(url):
    m=re.search(r"(\d{2})([a-z]{3})(\d{4})-(\d{2})([a-z]{3})(\d{4})",url,re.I)
    if not m:return datetime.utcnow().date().isoformat()
    return datetime.strptime(m.group(4)+m.group(5)+m.group(6),"%d%b%Y").date().isoformat()

def build(latest,previous,period):
    rows=[]
    for sym,cur in latest.items():
        prev=previous.get(sym,{})
        increased=reduced=unchanged=new=exited=0
        for mgr,v in cur.items():
            if mgr not in prev:new+=1; increased+=1
            else:
                d=v["shares"]-prev[mgr]["shares"]
                if d>0:increased+=1
                elif d<0:reduced+=1
                else:unchanged+=1
        for mgr in prev:
            if mgr not in cur: exited+=1; reduced+=1
        total=sum(v["shares"] for v in cur.values())
        prior=sum(v["shares"] for v in prev.values())
        value=sum(v["value"] for v in cur.values())
        prior_value=sum(v["value"] for v in prev.values())
        def manager_row(mgr,v):
            prior_v=prev.get(mgr,{})
            prior_shares=float(prior_v.get("shares",0) or 0)
            shares=float(v.get("shares",0) or 0)
            change=shares-prior_shares
            change_pct=((change/prior_shares)*100) if prior_shares>0 else None
            status="new" if mgr not in prev else ("increased" if change>0 else "reduced" if change<0 else "unchanged")
            return {
                "name":mgr,"shares":shares,"priorShares":prior_shares,"change":change,
                "changePct":change_pct,"value":float(v.get("value",0) or 0),
                "priorValue":float(prior_v.get("value",0) or 0),"status":status
            }
        all_current=[manager_row(mgr,v) for mgr,v in cur.items()]
        top=sorted(all_current,key=lambda x:x["value"],reverse=True)[:15]
        buyers=sorted([x for x in all_current if x["change"]>0],key=lambda x:x["change"],reverse=True)[:15]
        sellers=sorted([x for x in all_current if x["change"]<0],key=lambda x:x["change"])[:15]
        new_positions=sorted([x for x in all_current if x["status"]=="new"],key=lambda x:x["value"],reverse=True)[:15]
        exits=[]
        for mgr,v in prev.items():
            if mgr not in cur:
                exits.append({"name":mgr,"shares":0,"priorShares":float(v.get("shares",0) or 0),
                              "change":-float(v.get("shares",0) or 0),"changePct":-100.0,
                              "value":0,"priorValue":float(v.get("value",0) or 0),"status":"exited"})
        exits=sorted(exits,key=lambda x:x["priorValue"],reverse=True)[:15]
        issuer=next(iter(cur.values())).get("issuer","") if cur else ""
        rows.append({
            "symbol":sym,"period_end":period,"issuer_name":issuer,
            "source":"SEC Form 13F structured data",
            "match_confidence":"normalized SEC issuer-name exact",
            "reporting_managers":len(cur),"increased_managers":increased,
            "reduced_managers":reduced,"unchanged_managers":unchanged,
            "new_managers":new,"exited_managers":exited,
            "total_shares":total,"prior_total_shares":prior,
            "net_share_change":total-prior,"total_value":value,"prior_total_value":prior_value,
            "top_holders":{"topHolders":top,"biggestBuyers":buyers,"biggestSellers":sellers,
                           "newPositions":new_positions,"exits":exits},
            "source_url":LATEST,"synced_at":datetime.now().astimezone().isoformat()
        })
    return rows

def upsert(rows):
    endpoint=SUPABASE_URL+"/rest/v1/nivora_institutional_snapshots?on_conflict=symbol,period_end"
    for i in range(0,len(rows),250):
        body=json.dumps(rows[i:i+250]).encode()
        req=urllib.request.Request(endpoint,data=body,method="POST",headers={
            "apikey":SERVICE,"Authorization":"Bearer "+SERVICE,
            "Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"
        })
        with urllib.request.urlopen(req,timeout=120) as r:r.read()
        print("upserted",min(i+250,len(rows)),"/",len(rows),file=sys.stderr)

def main():
    global LATEST,PREVIOUS
    if not LATEST or not PREVIOUS:
        auto_latest,auto_previous=discover_urls()
        LATEST=LATEST or auto_latest
        PREVIOUS=PREVIOUS or auto_previous
    print("latest",LATEST,file=sys.stderr); print("previous",PREVIOUS,file=sys.stderr)
    tickers=load_tickers()
    latest=quarter(LATEST,tickers)
    previous=quarter(PREVIOUS,tickers)
    rows=build(latest,previous,period_from_url(LATEST))
    upsert(rows)
    print(json.dumps({"ok":True,"symbols":len(rows),"period":period_from_url(LATEST)}))

if __name__=="__main__":main()
