import test from'node:test';import assert from'node:assert/strict';
process.env.AURYN_APP_API_KEY='session-origin-regression-key-123456';
const{server}=await import('../src/server/app.js');
const listen=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port))),close=()=>new Promise(resolve=>server.close(resolve));

test('foreign-Origin session login is denied before credentials execute',async()=>{const port=await listen();try{const response=await fetch(`http://127.0.0.1:${port}/api/session`,{method:'POST',headers:{origin:'https://attacker.example','content-type':'application/json'},body:JSON.stringify({apiKey:process.env.AURYN_APP_API_KEY})});assert.equal(response.status,401);assert.equal((await response.json()).error,'unauthorized')}finally{await close()}});

test('foreign-Origin session logout is denied and does not revoke the session',async()=>{const port=await listen(),base=`http://127.0.0.1:${port}`;try{const login=await fetch(`${base}/api/session`,{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({apiKey:process.env.AURYN_APP_API_KEY})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie');const attack=await fetch(`${base}/api/session`,{method:'DELETE',headers:{origin:'https://attacker.example',cookie}});assert.equal(attack.status,401);const state=await fetch(`${base}/api/session`,{headers:{cookie}}).then(response=>response.json());assert.equal(state.authenticated,true)}finally{await close()}});
