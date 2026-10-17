import type {Preferences} from './appearance.mjs';
export function saveAppearance(auth:any,raw:Partial<Preferences>):Promise<{scope:'device'|'account';value:Preferences}>;
