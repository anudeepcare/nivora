import {normalizePreferences} from './appearance.mjs';
/** Preferences are user-editable presentation data, never authorization claims. */
export async function saveAppearance(auth,raw){
 const value=normalizePreferences(raw);
 const sessionResult=await auth.getSession();
 if(sessionResult.error)throw sessionResult.error;
 if(!sessionResult.data?.session)return {scope:'device',value};
 const result=await auth.updateUser({data:{auryn_appearance:value}});
 if(result.error)throw result.error;
 if(!result.data?.user)throw new Error('The account did not confirm the preferences update.');
 return {scope:'account',value};
}
