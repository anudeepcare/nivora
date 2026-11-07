const statuses=['new','in_progress','resolved'];
const priorities=['normal','high','urgent'];
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function supportSearch(value:unknown){if(typeof value!=='string'||value.length>160||/[\u0000-\u001f]/.test(value))throw Error('Use up to 160 characters for search.');return value.trim().replace(/\s+/g,' ');}
export function supportUpdate(value:unknown){
 if(!value||typeof value!=='object')throw Error('Choose requests to update.');
 const b=value as Record<string,unknown>,raw=Array.isArray(b.ids)?b.ids:[b.id];
 if(!raw.length||raw.length>50||raw.some(id=>typeof id!=='string'||!uuid.test(id)))throw Error('Choose between 1 and 50 valid requests.');
 const patch:Record<string,string>={};
 if(b.status!==undefined){if(!statuses.includes(String(b.status)))throw Error('Choose a valid status.');patch.status=String(b.status);}
 if(b.priority!==undefined){if(!priorities.includes(String(b.priority)))throw Error('Choose a valid priority.');patch.priority=String(b.priority);}
 if(b.assignee!==undefined){if(typeof b.assignee!=='string'||b.assignee.length>120||/[\u0000-\u001f]/.test(b.assignee))throw Error('Use up to 120 characters for the assignee.');patch.assignee=b.assignee.trim();}
 if(!Object.keys(patch).length)throw Error('Choose an update.');
 return {ids:[...new Set(raw)] as string[],patch};
}
