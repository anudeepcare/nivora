"use client";
import {useState} from 'react';
import {Eye,EyeOff} from 'lucide-react';
export default function PasswordField({value,onChange,create=false}:{value:string;onChange:(s:string)=>void;create?:boolean}){const [show,setShow]=useState(false);return <label className="aurynField">Password<span className="uxPassword"><input required minLength={create?8:undefined} autoComplete={create?'new-password':'current-password'} type={show?'text':'password'} value={value} onChange={e=>onChange(e.target.value)}/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label>}
