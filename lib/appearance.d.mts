export type Preferences={theme:string;accent:string;density:string;textSize:string;numberFormat:string;motion:string;chartStyle:string;primaryView:string};
export function normalizePreferences(raw?:Partial<Preferences>):Preferences;
export function resolveTheme(theme:string,dark:boolean):string;
export function safeDestination(value:string|null):string;
