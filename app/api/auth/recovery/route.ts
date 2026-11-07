import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { recoveryCookieName, validRecoveryProof } from "@/lib/recovery-proof";
export const dynamic = "force-dynamic";
async function recovery(request: Request, update: boolean) {
  const result = (body: unknown, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  if (update && request.headers.get("origin") !== new URL(request.url).origin)
    return result({ error: "Please reopen the reset page." }, 403);
  const store = await cookies(),
    writes: { name: string; value: string; options: CookieOptions }[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !secret)
    return result(
      { error: "Password recovery is temporarily unavailable." },
      503,
    );
  try {
    const client = createServerClient(url, key, {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (values: typeof writes) => {
          writes.push(...values);
        },
      },
    });
    const { data: identity, error } = await client.auth.getUser();
    const { data } = await client.auth.getSession();
    if (
      error ||
      !identity.user ||
      !data.session ||
      !validRecoveryProof(
        store.get(recoveryCookieName)?.value,
        identity.user.id,
        data.session.access_token,
        secret,
      )
    ) {
      const response = result(
        {
          error: "This reset link could not be verified. Request a fresh link.",
        },
        401,
      );
      response.cookies.set(recoveryCookieName, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }
    if (!update) return result({ email: identity.user.email });
    const body = await request.json();
    if (
      typeof body.password !== "string" ||
      body.password.length < 8 ||
      body.password.length > 128
    )
      return result(
        { error: "Use a password between 8 and 128 characters." },
        400,
      );
    const changed = await client.auth.updateUser({ password: body.password });
    if (changed.error)
      return result(
        {
          error:
            changed.error.code === "same_password"
              ? "Choose a password different from your current password."
              : "The password could not be updated. Choose a different password or request a fresh link.",
        },
        400,
      );
    const response = result({ ok: true });
    for (const { name, value, options } of writes)
      response.cookies.set(name, value, options);
    response.cookies.set(recoveryCookieName, "", {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch {
    return result(
      { error: "Password recovery could not be completed. Please try again." },
      503,
    );
  }
}
export const GET = (request: Request) => recovery(request, false);
export const POST = (request: Request) => recovery(request, true);
