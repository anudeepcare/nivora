const validId=value=>typeof value==='string'&&value.length>=3;

export class AccountSessionCoordinator{
  constructor({expectedUserId,fetchSession,channel=null,onLock=()=>{},onReload=()=>{}}={}){this.expectedUserId=expectedUserId;this.fetchSession=fetchSession;this.channel=channel;this.onLock=onLock;this.onReload=onReload;this.pending=null;this.listener=event=>{if(event?.data?.type==='auth-changed')this.verify()}}
  start(){this.channel?.addEventListener?.('message',this.listener);return this}
  stop(){this.channel?.removeEventListener?.('message',this.listener);this.channel?.close?.()}
  announce(){this.channel?.postMessage?.({type:'auth-changed'})}
  async verify(){if(this.pending)return this.pending;this.pending=(async()=>{let session;try{session=await this.fetchSession()}catch{this.onLock('session-unavailable');return false}const actual=session?.authenticated&&validId(session.user?.id)?session.user.id:null;if(actual===this.expectedUserId)return true;this.onLock(actual?'identity-mismatch':'signed-out');this.onReload();return false})().finally(()=>{this.pending=null});return this.pending}
  settled(){return this.pending??Promise.resolve()}
}
