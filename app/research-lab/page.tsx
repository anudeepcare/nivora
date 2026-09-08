import AppShell from '@/components/AppShell';
import {featureCatalogSummary} from '@/lib/auryn/v9/feature-registry';
import {AURYN_V9_RESEARCH_VERSION} from '@/lib/auryn/v9/version';

export default function ResearchLabPage(){
 const s=featureCatalogSummary();
 const top=Object.entries(s.byFamily).sort((a,b)=>Number(b[1])-Number(a[1]));
 return <AppShell><section className="v65EvidencePage">
  <div className="v65PageHead"><div><div className="eyebrow">AURYN V9 · RESEARCH LAB</div><h1>Test ideas before they touch decisions.</h1><p>V9 generates a broad candidate hypothesis universe, then requires chronological out-of-sample, cost, regime and false-discovery gates. Untested breadth is not predictive proof.</p></div></div>
  <div className="v65EvidenceState"><article><small>CANDIDATE HYPOTHESES</small><b>{s.candidateCount.toLocaleString()}</b><span>{s.baseMetricCount} base metrics · {s.theoryCount} theory groups</span></article><article><small>FEATURE FAMILIES</small><b>{s.familyCount}</b><span>Technical, fundamental, valuation, narrative, macro, options and execution context</span></article><article><small>PRODUCTION PROMOTION</small><b>MANUAL GATE</b><span>No feature can silently rewrite the CIO.</span></article><article><small>MODEL EVIDENCE</small><b>UNPROVEN</b><span>Historical observations must be supplied and survive OOS testing before promotion.</span></article></div>
  <section className="tradingAudit"><div className="tradingAuditHead"><div><small>FEATURE UNIVERSE</small><h2>Research breadth by family</h2></div><span>{AURYN_V9_RESEARCH_VERSION}</span></div><div className="tradingAuditTable"><div className="tradingAuditRow head"><span>Family</span><span>Candidates</span><span>State</span><span>Production</span><span>Evidence</span><span>Action</span></div>{top.map(([family,n])=><div className="tradingAuditRow" key={family}><b>{family.replaceAll('_',' ')}</b><span>{Number(n).toLocaleString()}</span><span>Research</span><span>Not automatic</span><span>Untested</span><span>Run tournament</span></div>)}</div></section>
  <div className="v65NoEvidence"><small>ANTI-OVERFITTING RULE</small><h2>100,000 hypotheses are not 100,000 production signals.</h2><p>AURYN keeps only candidates that remain useful after transaction costs, chronological out-of-sample testing, regime checks and multiple-hypothesis correction. Production adoption is explicit and versioned.</p></div>
 </section></AppShell>
}
