const pick=(v,a,d)=>a.includes(v)?v:d;
export function normalizePreferences(raw={}){
 const legacy={sapphire:'dark',noir:'dark',classic:'light',arctic:'light',porcelain:'light',racing:'light',bordeaux:'light'};
 return {theme:pick(legacy[raw.theme]||raw.theme,['light','dark','system'],'light'),accent:pick(raw.accent,['blue','violet','teal','amber','coral','pink'],'blue'),density:pick(raw.density,['comfortable','compact'],'comfortable'),textSize:pick(raw.textSize,['compact','standard','large'],'standard'),numberFormat:pick(raw.numberFormat,['standard','abbreviated'],'standard'),motion:pick(raw.motion,['standard','reduced'],'standard'),chartStyle:pick(raw.chartStyle,['candlestick','line','heikin'],'candlestick'),primaryView:pick(raw.primaryView,['/analyze','/portfolio','/watchlist','/alerts'],'/analyze')};
}
export const resolveTheme=(theme,dark)=>theme==='system'?(dark?'dark':'light'):theme;
export const safeDestination=(value)=>['/dashboard','/onboarding','/reset-password','/personalization'].includes(value)?value:'/dashboard';
