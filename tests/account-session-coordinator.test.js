import test from'node:test';
import assert from'node:assert/strict';
import{AccountSessionCoordinator}from'../src/public/account-session-coordinator.js';

const channel=()=>{const listeners=[];return{messages:[],addEventListener:(_type,fn)=>listeners.push(fn),postMessage(message){this.messages.push(message);for(const fn of listeners)fn({data:message})},close(){},emit(message){for(const fn of listeners)fn({data:message})}}};

test('cross-tab auth change locks and reloads when the server identity changed',async()=>{const bus=channel(),events=[],coordinator=new AccountSessionCoordinator({expectedUserId:'user-a',fetchSession:async()=>({authenticated:true,user:{id:'user-b'}}),channel:bus,onLock:reason=>events.push(['lock',reason]),onReload:()=>events.push(['reload'])});coordinator.start();bus.emit({type:'auth-changed'});await coordinator.settled();assert.deepEqual(events,[['lock','identity-mismatch'],['reload']]);coordinator.stop()});

test('focus revalidation keeps the tab unlocked only for the same verified identity',async()=>{const events=[],coordinator=new AccountSessionCoordinator({expectedUserId:'user-a',fetchSession:async()=>({authenticated:true,user:{id:'user-a'}}),onLock:reason=>events.push(reason),onReload:()=>events.push('reload')});assert.equal(await coordinator.verify(),true);assert.deepEqual(events,[])});

test('logout in another tab locks stale data before reload',async()=>{const bus=channel(),events=[],coordinator=new AccountSessionCoordinator({expectedUserId:'user-a',fetchSession:async()=>({authenticated:false,user:null}),channel:bus,onLock:reason=>events.push(['lock',reason]),onReload:()=>events.push(['reload'])});coordinator.start();bus.emit({type:'auth-changed'});await coordinator.settled();assert.deepEqual(events,[['lock','signed-out'],['reload']])});

test('announcing an auth change notifies other tabs without exposing identity',()=>{const bus=channel(),coordinator=new AccountSessionCoordinator({expectedUserId:'user-a',fetchSession:async()=>({authenticated:true,user:{id:'user-a'}}),channel:bus});coordinator.announce();assert.deepEqual(bus.messages,[{type:'auth-changed'}])});
