"use client";
import Link from 'next/link';
import type {Research} from '@/lib/types';
import {positionContext} from '@/lib/position-context';
import {advancedStudies} from '@/lib/advanced-research';
import {amount,percent,dateLabel} from '@/lib/format';
import {useProduct} from './Session';
import {useWorkspaceQuotes} from './Workspace';
export default function PositionAwareResearch({research:r}:{research:Research}){const {workspace}=useProduct();if(!workspace?.positions.some(p=>p.symbol===r.company.symbol&&p.assetType!=='cash'))return null;return <PositionEvidence research={r}/>;}
function PositionEvidence({research:r}:{research:Research}){const {workspace,demo}=useProduct(),quotes=useWorkspaceQuotes('portfolio'),q=Object.fromEntries(Object.entries(quotes.data??{}).flatMap(([symbol,row])=>row.quote?[[symbol,row.quote]]:[]));q[r.company.symbol]=r.quote;const gap=advancedStudies(r.history,r.retrievedAt).largestGap,c=positionContext(workspace?.positions??[],q,r.company.symbol,gap);return <aside className="position-aware" aria-label="Your holding in this research"><div><span className="eyebrow">YOUR POSITION · {c.quantity.toLocaleString()} UNITS</span><h3>{c.weight==null?'Pricing needed for exposure':`${percent(c.weight)} of currently priced portfolio value`}</h3><p>{c.value==null?'A current USD quote is required.':`${amount(c.value,'USD')} · Quote ${dateLabel(r.quote.asOf)}`}{quotes.loading?' · Remaining holdings are loading':c.missing.length?` · ${c.missing.length} symbols excluded from the denominator`:''}</p></div><div><span>Observed-gap stress</span><strong>{c.gapLoss==null?'Not established':amount(-c.gapLoss,'USD')}</strong><small>Applies the largest observed absolute opening gap downward. Hypothetical, not a loss bound.</small></div><Link href={`${demo?'/preview':''}/portfolio`}>View holding →</Link></aside>;}
