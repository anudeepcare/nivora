export function themePreference(value:string|null):'light'|'dark'|'system'{return value==='dark'||value==='system'?value:'light';}
export function resolvedTheme(value:'light'|'dark'|'system',systemDark:boolean):'light'|'dark'{return value==='system'?(systemDark?'dark':'light'):value;}
