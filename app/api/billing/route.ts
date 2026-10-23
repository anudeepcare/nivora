import { account, failure, privateJson, limit, HttpError } from "@/lib/server";
import { billingStatus, billingAction } from "@/lib/billing";
export const runtime = "nodejs";
export async function GET(r: Request) {
  try {
    const { user } = await account(r);
    limit(`billing-read:${user.id}`, 30);
    return privateJson(await billingStatus(user.id));
  } catch (e) {
    return failure(e);
  }
}
export async function POST(r: Request) {
  try {
    const { user } = await account(r);
    limit(`billing-write:${user.id}`, 12);
    if (Number(r.headers.get("content-length")) > 2048)
      throw new HttpError("Request too large.", 413);
    const body = await r.json();
    return privateJson(await billingAction(user.id, user.email, body.action));
  } catch (e) {
    return failure(e);
  }
}
