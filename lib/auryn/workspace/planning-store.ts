"use client";
import {supabaseBrowser} from '@/lib/supabase';
import type {PlanningJournalStore,DecisionRecord,ReviewRecord} from '@/lib/auryn/planning/journal';
async function call(path:string,body?:unknown){const {data,error}=await supabaseBrowser().auth.getSession();if(error||!data.session?.access_token)throw Error('Sign in again to access your decision journal.');const response=await fetch(path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${data.session.access_token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();if(!response.ok)throw Error(result.error||'The account journal is unavailable. Nothing has been saved.');return result;}
/** Owner identity comes only from the server-verified session; original records use INSERT and RLS denies edits. */
export const authenticatedPlanningJournalStore:PlanningJournalStore={
 scope:'authenticated',
 async list(symbol){const result=await call(`/api/research-workspace?scope=planning&symbol=${encodeURIComponent(symbol)}`);if(result.truncated)throw Error('This journal exceeds the supported history page. Contact support to export the full journal.');return {decisions:result.decisions as DecisionRecord[],reviews:result.reviews as ReviewRecord[]};},
 async appendDecision(record){await call('/api/research-workspace',{op:'save-planning',kind:'decision-journal',key:record.id,payload:record});},
 async appendReview(record){await call('/api/research-workspace',{op:'save-planning',kind:'decision-review',key:record.id,payload:record});}
};
