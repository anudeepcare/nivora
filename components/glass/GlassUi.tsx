import type {ReactNode,ButtonHTMLAttributes} from 'react';
import {Info} from 'lucide-react';
export function Panel({title,children,action,className=''}:{title?:ReactNode;children:ReactNode;action?:ReactNode;className?:string}){return <section className={`au-panel ${className}`}>{title&&<div className="au-panelhead"><h2>{title}</h2>{action}</div>}{children}</section>}
export function PageHeading({title,subtitle,action}:{title:string;subtitle?:ReactNode;action?:ReactNode}){return <header className="au-head"><div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action}</header>}
export function Pill({children,tone=''}:{children:ReactNode;tone?:'good'|'warn'|'bad'|'blue'|''}){return <span className={`au-pill ${tone?'au-'+tone:''}`}>{children}</span>}
export function Note({children}:{children:ReactNode}){return <div className="au-note"><Info size={16}/><span>{children}</span></div>}
export function Button({primary=false,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{primary?:boolean}){return <button type="button" {...props} className={`au-btn ${primary?'au-primary':''} ${className}`}/>}
export function DataRow({label,value,detail}:{label:ReactNode;value:ReactNode;detail?:ReactNode}){return <div className="au-listrow"><div><strong>{label}</strong>{detail&&<span className="au-meta">{detail}</span>}</div><div className="au-end">{value}</div></div>}
export const compactAmount=(value:unknown,currency='USD')=>typeof value!=='number'||!Number.isFinite(value)?'Unavailable':new Intl.NumberFormat('en-US',{style:'currency',currency:/^[A-Z]{3}$/.test(currency)?currency:'USD',notation:'compact',maximumFractionDigits:1}).format(value);
