const ACTIVE_KEY='auryn.active-user.v1';
const legacyKeys=['auryn.settings.v1','auryn.watchlist','auryn.watchlist.snapshots.v1','auryn.portfolio','auryn.portfolio.cash.v1'];
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/.test(value);
const encoded=value=>{const bytes=new TextEncoder().encode(value);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')};

export const activeUserId=session=>{const value=session?.getItem?.(ACTIVE_KEY);return validId(value)?value:null};
export const activateUserStorage=(session,userId)=>{if(!validId(userId))return false;session.setItem(ACTIVE_KEY,userId);return true};
export const deactivateUserStorage=session=>session?.removeItem?.(ACTIVE_KEY);
export const legacyDataSummary=backing=>{const keys=legacyKeys.filter(key=>backing?.getItem?.(key)!==null);return{present:keys.length>0,keys:keys.sort()}};
export function createUserStorage(backing,session){
  const scoped=key=>{const user=activeUserId(session);return user?`auryn.user.${encoded(user)}.${key}`:null};
  return{
    getItem(key){const target=scoped(key);return target?backing.getItem(target):null},
    setItem(key,value){const target=scoped(key);if(!target)throw new Error('customer storage is unavailable before authentication');backing.setItem(target,String(value))},
    removeItem(key){const target=scoped(key);if(target)backing.removeItem(target)},
    get length(){return 0},key(){return null},
  };
}
