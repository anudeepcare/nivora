export type AuthProviders={google:boolean|null;x:boolean|null};
export function enabledAuthProviders(settings:unknown):AuthProviders {
 const external=settings&&typeof settings==='object'&&'external' in settings?settings.external:null;
 if(!external||typeof external!=='object')return {google:null,x:null};
 const flags=external as Record<string,unknown>;
 // Some hosted Auth versions omit X from public settings even when the
 // dashboard enables OAuth2. Missing is unknown, not a disabled provider.
 return {google:typeof flags.google==='boolean'?flags.google:null,x:typeof flags.x==='boolean'?flags.x:null};
}
