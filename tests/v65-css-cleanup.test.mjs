import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("globals CSS is pruned of unused legacy presentation selectors",()=>{
 const css=fs.readFileSync("app/globals.css","utf8");
 const source=["app","components"].flatMap(dir=>walk(dir)).map(f=>fs.readFileSync(f,"utf8")).join("\n");
 const legacy=[...css.matchAll(/\.(v(?:12|18|22|26|29|32|33|34|37|41|48|57|64)\w*)/g)].map(m=>m[1]);
 const orphan=[...new Set(legacy)].filter(c=>!source.includes(c));
 assert.deepEqual(orphan,[],`orphan legacy selectors: ${orphan.slice(0,20).join(", ")}`);
});
function walk(dir){const out=[];for(const x of fs.readdirSync(dir,{withFileTypes:true})){const p=`${dir}/${x.name}`;if(x.isDirectory())out.push(...walk(p));else if(/\.(ts|tsx|js|jsx)$/.test(x.name))out.push(p)}return out}
