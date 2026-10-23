import { account, failure, privateJson, limit, HttpError } from "@/lib/server";
import { billingStatus, billingAction } from "@/lib/billing";
import { billingDiagnostic } from "@/lib/billing-diagnostics";
import { NextResponse } from "next/server";
function billingFailure(e: unknown, stage: string) {
  if (e instanceof HttpError) return failure(e);
  const d = billingDiagnostic(e, stage, crypto.randomUUID().slice(0, 12));
  console.error("auryn_billing_failure", d);
  return NextResponse.json(
    { error: d.message, code: d.code, reference: d.reference },
    { status: 503, headers: { "Cache-Control": "private, no-store" } },
  );
}
export const runtime = "nodejs";
export async function GET(r: Request) {
  try {
    const { user } = await account(r);
    limit(`billing-read:${user.id}`, 30);
    return privateJson(await billingStatus(user.id));
  } catch (e) {
    return billingFailure(e, "status");
  }
}
export async function POST(r: Request) {
  let stage = "authentication";
  try {
    const { user } = await account(r);
    limit(`billing-write:${user.id}`, 12);
    if (Number(r.headers.get("content-length")) > 2048)
      throw new HttpError("Request too large.", 413);
    const body = await r.json();
    return privateJson(
      await billingAction(user.id, user.email, body.action, (value) => {
        stage = value;
      }),
    );
  } catch (e) {
    return billingFailure(e, stage);
  }
}
