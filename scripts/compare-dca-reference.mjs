import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {researchAccumulation} from '../lib/accumulation-policy-v5.ts';
const input=process.argv[2];if(!input)throw Error('Supply a private map of symbol to daily OHLC bars.');
const data=JSON.parse(fs.readFileSync(input));
const reference=JSON.parse(fs.readFileSync('verification/dca-reference-30.json'));
const asOf='2026-10-22T23:00:00Z';
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync('lib/accumulation-policy-v5.ts')).digest('hex');
const frozen=hash();
const rows=reference.rows.map(ref=>{
 const bars=data[ref.symbol];if(!Array.isArray(bars))return {...ref,available:false,reason:'Missing daily history'};
 const r=researchAccumulation(bars,asOf);
 const confirmed=r.confirmed?.multiplier??null,forming=r.forming?.multiplier??null;
 return {symbol:ref.symbol,observations:bars.length,confirmedDate:r.confirmed?.date??null,formingDate:r.forming?.date??null,
  aurynConfirmed:confirmed,referenceConfirmed:ref.confirmed,confirmedMatch:confirmed===ref.confirmed,
  aurynForming:forming,referenceForming:ref.forming,formingMatch:forming===ref.forming};
});
assert.equal(hash(),frozen);
const report={asOf,policy:'monthly-v5',policyHash:frozen,source:reference.source,selection:reference.selection,
 limitations:['Numerical agreement is not investment performance or predictive accuracy.','This is a selected snapshot, partly overlapping prior calibration; not independent proof of parity.','Different adjustment histories and listing lengths can affect monthly features.','Reference Bear/Consensus/Bull is a third-party analyst-target range, not our calculated intrinsic valuation. No all-stock valuation parity is claimed.','No ticker overrides or policy changes were made to match these observations.'],
 summary:{stocks:rows.length,confirmedMatches:rows.filter(x=>x.confirmedMatch).length,formingMatches:rows.filter(x=>x.formingMatch).length},rows};
fs.writeFileSync('verification/dca-comparison-30.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));
