import {createClient, type User} from "@supabase/supabase-js";
import {NextResponse} from "next/server";

type Authorization = {user:User;response?:never}|{user?:never;response:NextResponse};
const reject=(status:number,reason:string):Authorization=>({response:NextResponse.json({status:"error",error:reason,reason},{status,headers:{"Cache-Control":"private, no-store"}})});

/** Always validate with Auth; never trust a client-supplied id or editable metadata. */
export async function authorizeRequest(req:Request,adminOnly=false):Promise<Authorization>{
 const token=/^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization")||"")?.[1];
 if(!token)return reject(401,"Sign in to continue.");
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return reject(503,"Authentication is not configured.");
 try{
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await client.auth.getUser(token);
  if(error||!user)return reject(401,"Your session is invalid or expired. Sign in again.");
  const allowedIds=(process.env.AURYN_ADMIN_USER_IDS||"").split(",").map(id=>id.trim()).filter(Boolean);
  if(adminOnly&&!allowedIds.includes(user.id)&&user.app_metadata?.role!=="admin")return reject(403,"Administrator access is required for the shared Paper Trading Lab.");
  return {user};
 }catch{return reject(503,"Authentication is temporarily unavailable.");}
}
