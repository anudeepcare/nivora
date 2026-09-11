import {NextResponse} from "next/server";
import {createClient,type SupabaseClient} from "@supabase/supabase-js";
import {AlpacaPaperBroker} from "@/lib/alpaca-paper";
import {deriveTradeIntent} from "@/lib/nivora-trade-intent";
import {mapInstitutionalActionToToday} from "@/lib/auryn/v9343/execution-policy";
import {evaluateTradingRisk,DEFAULT_PAPER_RISK_POLICY,type TradingRiskContext} from "@/lib/nivora-trading-risk";
import {planPaperOrder} from "@/lib/nivora-paper-execution";
import {marketSessionAt} from "@/lib/nivora-market-session";
import {loadTradingMarketData} from "@/lib/nivora-trading-market-data";
import {ENGINE_VERSION,TRADING_LAB_VERSION} from "@/lib/nivora-version";
import {buildClosedTradesFromFills} from "@/lib/nivora-trading-metrics";
import {explainNoIntent} from "@/lib/nivora-trading-evaluation";
import {sizePosition} from "@/lib/nivora-position-sizing";
import {resolvePaperInvalidation} from "@/lib/v65/paper-invalidation";

export const dynamic="force-dynamic";

const unauthorized=()=>NextResponse.json({error:"Unauthorized."},{status:401});

async function refreshTradingMarketData(symbol:string,broker:AlpacaPaperBroker|null,twelveKey:string){
 let market=await loadTradingMarketData(symbol,broker,twelveKey,new Date());
 if((market.integrity.state==="STALE"||market.integrity.state==="DELAYED")&&marketSessionAt(new Date())==="REGULAR"){
  await new Promise(r=>setTimeout(r,250));
  market=await loadTradingMarketData(symbol,broker,twelveKey,new Date());
 }
 return market;
}

type Snapshot={
 id:string|number;
 symbol:string;
 observed_at:string;
 price:number;
 evidence_fingerprint:string|null;
 decision:any;
 evidence?:any;
};

async function recordRunnerHealth(db:SupabaseClient,ok:boolean,started:number,errorCode:string|null=null){
 await db.from("nivora_provider_health").insert({
  provider:"nivora",
  capability:"paper-runner",
  ok,
  latency_ms:Math.max(0,Date.now()-started),
  error_code:errorCode
 }).then(()=>undefined);
}

async function reconcileFills(db:SupabaseClient,broker:AlpacaPaperBroker){
 const activities=await broker.getFillActivities(new Date(Date.now()-30*24*60*60_000).toISOString());
 if(activities.length){
  const orderIds=[...new Set(activities.map(a=>a.orderId).filter(Boolean))];
  const {data:knownOrders}=orderIds.length
   ?await db.from("nivora_v61_paper_orders").select("id,broker_order_id").in("broker_order_id",orderIds)
   :{data:[] as any[]};
  const orderMap=new Map((knownOrders||[]).map((o:any)=>[String(o.broker_order_id),Number(o.id)]));
  for(const a of activities){
   await db.from("nivora_v61_trade_fills").upsert({
    order_id:orderMap.get(a.orderId)||null,
    broker_fill_id:a.id,
    symbol:a.symbol,
    side:a.side,
    qty:a.qty,
    fill_price:a.price,
    filled_at:a.transactionTime,
    fees:0,
    evidence:{broker:"alpaca",paper:true}
   },{onConflict:"broker_fill_id"});
  }
 }
 const {data:allFills}=await db.from("nivora_v61_trade_fills")
  .select("broker_fill_id,symbol,side,qty,fill_price,fees,filled_at")
  .order("filled_at",{ascending:true});
 const closed=buildClosedTradesFromFills((allFills||[]).map((f:any)=>({
  id:String(f.broker_fill_id||""),
  symbol:f.symbol,
  side:f.side,
  qty:Number(f.qty||0),
  price:Number(f.fill_price||0),
  fees:Number(f.fees||0)
 })));
 for(const c of closed){
  await db.from("nivora_v61_trade_fills")
   .update({realized_pnl:c.pnl,return_pct:c.returnPct})
   .eq("broker_fill_id",c.sourceFillId);
 }
}

async function run(req:Request,automatic=false){
 const started=Date.now();
 const secret=process.env.TRADING_LAB_CRON_SECRET||process.env.CRON_SECRET;
 if(!secret||req.headers.get("authorization")!==`Bearer ${secret}`)return unauthorized();

 if(process.env.TRADING_LAB_PAPER_ENABLED!=="true"){
  return NextResponse.json({status:"disabled",reason:"Set TRADING_LAB_PAPER_ENABLED=true to enable autonomous paper execution."});
 }

 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!serviceKey)return NextResponse.json({error:"Trading Lab storage is not configured."},{status:503});

 const alpacaKey=process.env.ALPACA_PAPER_API_KEY||"";
 const alpacaSecret=process.env.ALPACA_PAPER_API_SECRET||"";
 if(!alpacaKey||!alpacaSecret)return NextResponse.json({error:"Alpaca Paper credentials are not configured."},{status:503});

 const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const broker=new AlpacaPaperBroker(alpacaKey,alpacaSecret);
 const twelveKey=process.env.TWELVE_DATA_API_KEY||"";
 const session=marketSessionAt(new Date());
 const runId=crypto.randomUUID(),runStartedAt=new Date().toISOString();
 await db.from("nivora_v65_trading_runs").insert({id:runId,engine_version:ENGINE_VERSION,trading_lab_version:TRADING_LAB_VERSION,automatic,session,started_at:runStartedAt,status:"RUNNING"}).then(()=>undefined);
 const finishRun=async(status:string,results:any[]=[],error:string|null=null)=>{
  const submitted=results.filter(x=>x.status==="SUBMITTED").length,blocked=results.filter(x=>x.status==="BLOCKED").length,errors=results.filter(x=>x.status==="ERROR").length;
  await db.from("nivora_v65_trading_runs").update({finished_at:new Date().toISOString(),status,processed:results.length,submitted,blocked,errors,results,error}).eq("id",runId).then(()=>undefined);
 };

 // V65 deliberately executes automatic paper orders only during the regular session.
 // Premarket/after-hours prices remain visible research evidence but are not auto-execution liquidity.
 if(session!=="REGULAR"){
  await recordRunnerHealth(db,true,started,`SESSION_${session}`);
  await finishRun("SKIPPED",[],`SESSION_${session}`);
  return NextResponse.json({status:"skipped",code:"SESSION_NOT_EXECUTABLE",mode:"paper",session,automatic,engineVersion:ENGINE_VERSION,tradingLabVersion:TRADING_LAB_VERSION});
 }

 try{
  const clock=await broker.getClock();
  if(!clock.isOpen){
   await recordRunnerHealth(db,true,started,"BROKER_MARKET_CLOSED");
   await finishRun("SKIPPED",[],"BROKER_MARKET_CLOSED");
   return NextResponse.json({status:"skipped",code:"BROKER_MARKET_CLOSED",mode:"paper",session,automatic,brokerClock:clock,engineVersion:ENGINE_VERSION,tradingLabVersion:TRADING_LAB_VERSION});
  }

  const recordEvaluation=async(snapshot:Snapshot,status:string,action:string,reason:string,riskCode:string|null=null,clientOrderId:string|null=null,details:any={})=>{
   const {error}=await db.from("nivora_v61_trade_evaluations").upsert({
    evaluation_key:`${String(snapshot.id)}:${status}`,
    snapshot_id:String(snapshot.id),
    symbol:String(snapshot.symbol||"").toUpperCase(),
    evaluated_at:new Date().toISOString(),
    today_action:action,
    status,
    reason,
    risk_code:riskCode,
    client_order_id:clientOrderId,
    engine_version:ENGINE_VERSION,
    trading_lab_version:TRADING_LAB_VERSION,
    details
   },{onConflict:"evaluation_key"});
   if(error)throw error;
  };

  const account=await broker.getAccount();
  const positions=await broker.getPositions();
  const positionMap=new Map(positions.map(p=>[p.symbol,p]));
  await reconcileFills(db,broker);

  const since=new Date(Date.now()-30*60_000).toISOString();
  const {data:snapshots,error}=await db.from("nivora_v59_decision_snapshots")
   .select("id,symbol,observed_at,price,evidence_fingerprint,decision,evidence")
   .eq("engine_version",ENGINE_VERSION)
   .gte("observed_at",since)
   .order("observed_at",{ascending:false})
   .limit(50);
  if(error)throw error;

  const latest=new Map<string,Snapshot>();
  for(const row of (snapshots||[]) as Snapshot[]){
   const symbol=String(row.symbol||"").toUpperCase();
   if(symbol&&!latest.has(symbol))latest.set(symbol,row);
  }

  const results:any[]=[];
  for(const snapshot of latest.values()){
   try{
    const d=snapshot.decision||{};
    const pos=positionMap.get(snapshot.symbol);
    const v5Meta=snapshot.evidence?.v5;
    const v931Meta=snapshot.evidence?.v931;
    const v934Meta=snapshot.evidence?.v934;
    const v935Meta=snapshot.evidence?.v935;
    const normalizedAction=(x:any)=>String(x||"").trim().toUpperCase().replaceAll(" ","_");
    if(!v935Meta?.snapshotId||v935Meta?.contract!=="AURYN_V9_3_5_CANONICAL_SNAPSHOT"){
     const reason="V9.3.5 canonical snapshot provenance is missing; Trading Lab fails closed until a fresh consolidated AURYN snapshot is persisted.";
     await recordEvaluation(snapshot,"BLOCKED",String(v931Meta?.newMoneyAction||"NONE"),reason,"V935_CANONICAL_SNAPSHOT_MISSING",null,{v935Meta:v935Meta??null});
     results.push({symbol:snapshot.symbol,status:"BLOCKED",action:String(v931Meta?.newMoneyAction||"NONE"),reason,riskCode:"V935_CANONICAL_SNAPSHOT_MISSING"});
     continue;
    }
    if(!v931Meta?.snapshotId||!v931Meta?.canonicalPrimaryAction){
     const reason="V9.3.1 canonical decision metadata is missing; Trading Lab fails closed until a fresh institutional decision snapshot is persisted.";
     await recordEvaluation(snapshot,"BLOCKED","NONE",reason,"CANONICAL_DECISION_MISSING",null,{v931Meta:v931Meta??null});
     results.push({symbol:snapshot.symbol,status:"BLOCKED",action:"NONE",reason,riskCode:"CANONICAL_DECISION_MISSING"});
     continue;
    }
    if(!v934Meta?.snapshotId||!v934Meta?.marketTruthSnapshotId||!v934Meta?.levels){
     const reason="V9.3.4 canonical market-intelligence metadata is missing; Trading Lab fails closed until a fresh multi-timeframe intelligence snapshot is persisted.";
     await recordEvaluation(snapshot,"BLOCKED",String(v931Meta.newMoneyAction||"NONE"),reason,"MARKET_INTELLIGENCE_MISSING",null,{v934Meta:v934Meta??null});
     results.push({symbol:snapshot.symbol,status:"BLOCKED",action:String(v931Meta.newMoneyAction||"NONE"),reason,riskCode:"MARKET_INTELLIGENCE_MISSING"});
     continue;
    }
    if(Array.isArray(v931Meta.hardVetoReasons)&&v931Meta.hardVetoReasons.length&&!["AVOID"].includes(normalizedAction(v931Meta.newMoneyAction))){
     const reason=`Canonical decision carries unresolved hard vetoes: ${v931Meta.hardVetoReasons.join(", ")}.`;
     await recordEvaluation(snapshot,"BLOCKED",String(v931Meta.newMoneyAction||"NONE"),reason,"CANONICAL_HARD_VETO",null,{v931Meta,v5Action:v5Meta?.action??null});
     results.push({symbol:snapshot.symbol,status:"BLOCKED",action:String(v931Meta.newMoneyAction||"NONE"),reason,riskCode:"CANONICAL_HARD_VETO"});
     continue;
    }
    if(v931Meta.executionAction!=="READY"){
     const reason="The persisted V9.3.1 institutional decision did not authorize execution for its canonical snapshot; a fresh execution-ready decision is required.";
     await recordEvaluation(snapshot,"BLOCKED",String(v931Meta.newMoneyAction||"NONE"),reason,"CANONICAL_EXECUTION_BLOCKED",null,{v931Meta});
     results.push({symbol:snapshot.symbol,status:"BLOCKED",action:String(v931Meta.newMoneyAction||"NONE"),reason,riskCode:"CANONICAL_EXECUTION_BLOCKED"});
     continue;
    }
    if(v5Meta?.trustState==="BLOCK"){
     const reason="Canonical trust audit blocked execution; the snapshot/decision/plan chain is not internally consistent.";
     await recordEvaluation(snapshot,"NO_INTENT","NONE",reason,"CANONICAL_TRUST");
     results.push({symbol:snapshot.symbol,status:"NO_INTENT",action:"NONE",reason});
     continue;
    }
    const today=v931Meta?.newMoneyAction?mapInstitutionalActionToToday(v931Meta.newMoneyAction,v931Meta.ownerAction||"HOLD",Boolean(pos)):d.today;
    if(!today){
     const x=explainNoIntent(undefined,false);
     await recordEvaluation(snapshot,"NO_INTENT","NONE",x.reason,x.code);
     results.push({symbol:snapshot.symbol,status:"NO_INTENT",action:"NONE",reason:x.reason});
     continue;
    }

    const intent=deriveTradeIntent({
     symbol:snapshot.symbol,
     snapshotId:String(v931Meta?.snapshotId||v5Meta?.snapshotId||snapshot.id),
     evidenceFingerprint:String(snapshot.evidence_fingerprint||""),
     price:Number(snapshot.price||0),
     observedAt:String(snapshot.observed_at),
     thesisScore:Number(v5Meta?.thesisStrength??d.thesisScore??0),
     opportunityScore:Number(v5Meta?.entryQuality??d.opportunityScore??0),
     companyScore:Number(v5Meta?.businessQuality??d.companyScore??0),
     today
    });

    if(!intent){
     const x=explainNoIntent(today,Boolean(pos));
     await recordEvaluation(snapshot,"NO_INTENT",String(today.action||"NO ACTION"),x.reason,x.code,null,{today});
     results.push({symbol:snapshot.symbol,status:"NO_INTENT",action:String(today.action||"NO ACTION"),reason:x.reason});
     continue;
    }

    const {data:existing}=await db.from("nivora_v61_trade_intents").select("id").eq("intent_id",intent.id).maybeSingle();
    if(existing){
     await recordEvaluation(snapshot,"DUPLICATE",String(today.action||"NO ACTION"),"This evidence/action already produced a trade intent.","DUPLICATE");
     results.push({symbol:snapshot.symbol,status:"DUPLICATE",action:String(today.action||"NO ACTION"),reason:"This evidence/action already produced a trade intent."});
     continue;
    }

    const market=await refreshTradingMarketData(snapshot.symbol,broker,twelveKey);
    if(market.integrity.state!=="LIVE_VERIFIED"){
     const reason="Paper execution requires two independently verified live providers; single-source, stale, closed-session, or disagreeing quotes are research-only.";
     await recordEvaluation(snapshot,"BLOCKED",String(today.action||"NO ACTION"),reason,"QUOTE_INTEGRITY",null,{integrityState:market.integrity.state,integrityTradable:false,disagreementPct:market.integrity.disagreementPct,automatic});
     results.push({symbol:snapshot.symbol,status:"BLOCKED",action:String(today.action||"NO ACTION"),reason,riskCode:"QUOTE_INTEGRITY",integrityState:market.integrity.state});
     continue;
    }
    const quote=market.integrity.chosen;
    const context:TradingRiskContext={
     equity:account.equity,
     cash:account.cash,
     dailyPnlPct:account.dailyPnlPct,
     currentPositionValue:Math.abs(pos?.marketValue||0),
     openPositions:positions.length,
     duplicate:false,
     quote:{
      price:quote?.price??0,
      ageSeconds:quote?.ageSeconds??null,
      freshness:quote?.freshness??"STALE",
      changePct:quote?.changePct??market.twelve?.changePct??null,
      spreadPct:quote?.spreadPct??null,
      integrityState:market.integrity.state
     }
    };

    const quoteDetails={
     quoteProvider:quote?.provider??null,
     quoteAgeSeconds:quote?.ageSeconds??null,
     quoteTimestamp:quote?.providerTimestamp??null,
     marketSession:quote?.session??session,
     spreadPct:quote?.spreadPct??null,
     integrityState:market.integrity.state,
     integrityTradable:market.integrity.state==="LIVE_VERIFIED",
     disagreementPct:market.integrity.disagreementPct,
     automatic,
     v935CanonicalSnapshotId:String(v935Meta.snapshotId||""),
     v935MarketSnapshotId:String(v935Meta.marketSnapshotId||""),
     v931SnapshotId:String(v931Meta.snapshotId),
     canonicalAction:String(v931Meta.canonicalPrimaryAction),
     canonicalOwnerAction:String(v931Meta.ownerAction||""),
     canonicalNewMoneyAction:String(v931Meta.newMoneyAction||""),
     v934SnapshotId:String(v934Meta.snapshotId||""),
     v934MarketTruthSnapshotId:String(v934Meta.marketTruthSnapshotId||""),
     v934Alignment:String(v934Meta.alignment||""),
     v934Timeframes:v934Meta.timeframes??null,
     v934Levels:v934Meta.levels??null
    };

    let executableIntent=intent;
    let sizing:any=null;
    if(intent.side==="BUY"){
     const v934Invalidation=Number(v934Meta?.actionMap?.invalidation??v934Meta?.levels?.invalidation);
     const invalidationResult=Number.isFinite(v934Invalidation)&&v934Invalidation>0
      ? {value:v934Invalidation,source:"V934_MARKET_INTELLIGENCE"}
      : resolvePaperInvalidation({entry:quote?.price??0,decision:d,evidence:snapshot.evidence});
     const invalidation=Number(invalidationResult.value||0);
     const baseRiskPerTradePct=Number(process.env.TRADING_LAB_RISK_PER_TRADE_PCT||0.5);
     const riskPerTradePct=String(v931Meta?.newMoneyAction||"")==="START_SMALL"?baseRiskPerTradePct*0.5:baseRiskPerTradePct;
     if(!quote||quote.price<=0||!invalidation||invalidation>=quote.price){
      await recordEvaluation(snapshot,"BLOCKED",String(today.action||"NO ACTION"),"A valid decision-linked invalidation is required before sizing new paper risk.","POSITION_SIZING",null,{...quoteDetails,invalidation,invalidationSource:invalidationResult.source,riskPerTradePct});
      results.push({symbol:snapshot.symbol,status:"BLOCKED",action:String(today.action||"NO ACTION"),reason:"A valid decision-linked invalidation is required before sizing new paper risk.",riskCode:"POSITION_SIZING"});
      continue;
     }
     sizing=sizePosition({
      equity:account.equity,
      entry:quote.price,
      invalidation,
      riskPerTradePct,
      maxPositionPct:DEFAULT_PAPER_RISK_POLICY.maxPositionPct,
      liquidityCapNotional:account.equity*(DEFAULT_PAPER_RISK_POLICY.maxTradePct/100)
     });
     if(!sizing.allowed){
      await recordEvaluation(snapshot,"BLOCKED",String(today.action||"NO ACTION"),sizing.reason,"POSITION_SIZING",null,{...quoteDetails,sizing,invalidationSource:invalidationResult.source,riskPerTradePct});
      results.push({symbol:snapshot.symbol,status:"BLOCKED",action:String(today.action||"NO ACTION"),reason:sizing.reason,riskCode:"POSITION_SIZING"});
      continue;
     }
     executableIntent={...intent,targetNotional:sizing.notional};
    }

    const risk=evaluateTradingRisk(executableIntent,context,DEFAULT_PAPER_RISK_POLICY);
    await db.from("nivora_v61_trade_intents").insert({
     intent_id:intent.id,
     symbol:intent.symbol,
     snapshot_id:intent.snapshotId,
     evidence_fingerprint:intent.evidenceFingerprint,
     side:intent.side,
     intent_type:intent.intentType,
     target_notional:executableIntent.targetNotional,
     approved_notional:risk.approvedNotional,
     status:risk.allowed?"AUTHORIZED":"BLOCKED",
     risk_code:risk.code,
     risk_reason:risk.reason,
     engine_version:ENGINE_VERSION,
     trading_lab_version:TRADING_LAB_VERSION,
     source_intent:executableIntent,
     source_context:context
    });

    if(!risk.allowed){
     await recordEvaluation(snapshot,"BLOCKED",String(today.action||"NO ACTION"),risk.reason,risk.code,null,{risk,...quoteDetails});
     results.push({symbol:snapshot.symbol,status:"BLOCKED",action:String(today.action||"NO ACTION"),reason:risk.reason,riskCode:risk.code,integrityState:market.integrity.state});
     continue;
    }

    if(!quote||quote.price<=0)throw new Error("Risk authorization occurred without a usable execution quote.");
    const order=planPaperOrder(executableIntent,risk.approvedNotional,quote.price);
    const submitted=await broker.submitOrder(order);

    await db.from("nivora_v61_paper_orders").insert({
     intent_id:intent.id,
     broker:"alpaca",
     broker_order_id:submitted.id,
     client_order_id:submitted.clientOrderId,
     symbol:submitted.symbol,
     side:submitted.side,
     qty:submitted.qty,
     limit_price:order.limitPrice,
     status:submitted.status,
     submitted_at:submitted.submittedAt||new Date().toISOString(),
     order_payload:order,
     broker_response:submitted
    });

    await recordEvaluation(snapshot,"SUBMITTED",String(today.action||"NO ACTION"),"Paper order submitted to Alpaca.",risk.code,submitted.clientOrderId,{risk,sizing,orderStatus:submitted.status,...quoteDetails});
    results.push({symbol:snapshot.symbol,status:"SUBMITTED",action:String(today.action||"NO ACTION"),reason:"Paper order submitted to Alpaca.",clientOrderId:submitted.clientOrderId,integrityState:market.integrity.state});
   }catch(error:any){
    const reason=error?.message||"Unexpected per-symbol paper execution error.";
    await recordEvaluation(snapshot,"ERROR",String(snapshot.decision?.today?.action||"NONE"),reason,"EXECUTION_ERROR").catch(()=>{});
    results.push({symbol:snapshot.symbol,status:"ERROR",action:String(snapshot.decision?.today?.action||"NONE"),reason});
   }
  }

  await recordRunnerHealth(db,true,started,null);
  await finishRun("OK",results,null);
  return NextResponse.json({status:"ok",mode:"paper",automatic,session,runId,engineVersion:ENGINE_VERSION,tradingLabVersion:TRADING_LAB_VERSION,processed:latest.size,results});
 }catch(error:any){
  await recordRunnerHealth(db,false,started,error?.message||"RUNNER_ERROR").catch(()=>{});
  await finishRun("ERROR",[],error?.message||"RUNNER_ERROR").catch(()=>{});
  return NextResponse.json({status:"error",mode:"paper",automatic,session,engineVersion:ENGINE_VERSION,tradingLabVersion:TRADING_LAB_VERSION,error:error?.message||"Paper runner failed."},{status:500});
 }
}

export async function POST(req:Request){return run(req,false)}
export async function GET(req:Request){return run(req,true)}
