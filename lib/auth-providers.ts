export type AuthProviders={google:boolean|null;x:boolean|null};
export function enabledAuthProviders(settings:unknown):AuthProviders {
 const external=settings&&typeof settings==='object'&&'external' in settings?settings.external:null;
 if(!external||typeof external!=='object')return {google:null,x:null};
 const flags=external as Record<string,unknown>;
 return {google:flags.google===true,x:flags.x===true};
}
