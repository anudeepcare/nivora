function canonicalize(value:unknown):unknown{
  if(Array.isArray(value))return value.map(canonicalize);
  if(value&&typeof value==='object'){
    const row=value as Record<string,unknown>;
    const out:Record<string,unknown>={};
    for(const key of Object.keys(row).sort())out[key]=canonicalize(row[key]);
    return out;
  }
  if(typeof value==='number'&&!Number.isFinite(value))return null;
  return value;
}

export function stableStringify(value:unknown){return JSON.stringify(canonicalize(value));}

export function deterministicFingerprint(value:unknown){
  const text=stableStringify(value);
  let h=14695981039346656037n;
  const prime=1099511628211n;
  const mask=0xffffffffffffffffn;
  for(let i=0;i<text.length;i++){
    h^=BigInt(text.charCodeAt(i));
    h=(h*prime)&mask;
  }
  return h.toString(16).padStart(16,'0');
}
