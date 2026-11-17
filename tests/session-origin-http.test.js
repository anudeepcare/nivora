import test from'node:test';import assert from'node:assert/strict';
const{server}=await import('../src/server/app.js');
const listen=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port))),close=()=>new Promise(resolve=>server.close(resolve));

test('foreign-Origin customer login is denied before credentials execute',async()=>{const port=await listen();try{const response=await fetch(`http://127.0.0.1:${port}/api/auth/session`,{method:'POST',headers:{origin:'https://attacker.example','content-type':'application/json'},body:JSON.stringify({email:'person@example.com',password:'password123'})});assert.equal(response.status,401);assert.equal((await response.json()).error,'unauthorized')}finally{await close()}});

test('foreign-Origin customer logout is denied before auth provider work',async()=>{const port=await listen(),base=`http://127.0.0.1:${port}`;try{const attack=await fetch(`${base}/api/auth/session`,{method:'DELETE',headers:{origin:'https://attacker.example',cookie:'auryn_access=opaque'}});assert.equal(attack.status,401);assert.equal((await attack.json()).error,'unauthorized')}finally{await close()}});
