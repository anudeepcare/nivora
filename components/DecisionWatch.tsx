"use client";
import {useMemo} from 'react';
import type {Research} from '@/lib/types';
import {researchDecision} from '@/lib/decision-research';
import {percent} from '@/lib/format';
export default function DecisionWatch({research:r}:{research:Research}){const d=useMemo(()=>researchDecision(r),[r]);if(!d.tripwires.length)return null;return <section className="decision-watch"><header className="section-head"><div><span className="eyebrow">Keep the thesis honest</span><h3>Evidence to revisit</h3><p>Screening thresholds from the latest financial period. These are review prompts, not automatic trade instructions or background alerts.</p></div></header><div>{d.tripwires.map(t=><section key={t.id} data-state={t.breached?'breached':t.headroom!=null&&t.headroom<20?'close':'clear'}><span>{t.label}</span><strong>{t.value.toFixed(1)}{t.unit==='percent'?'%':'×'}</strong><small>Review {t.direction} {t.threshold}{t.unit==='percent'?'%':'×'}</small><b>{t.breached?'Threshold reached':t.headroom==null?'Review the level':`${percent(t.headroom)} headroom`}</b></section>)}</div></section>;}
