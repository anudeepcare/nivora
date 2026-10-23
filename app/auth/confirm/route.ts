import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { completeEmailConfirmation } from "@/lib/auth-callback";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const cookieStore = await cookies();
  // Collect cookies even on exchange failure, so Supabase can remove stale authentication cookies.
  const writes: {name:string;value:string;options:import("@supabase/ssr").CookieOptions}[] = [];
  const destination = await completeEmailConfirmation(request.url, async value => {
    if (!url || !key) return {error: "configuration"};
    const client = createServerClient(url, key, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values: typeof writes) => {writes.push(...values);},
      },
    });
    return client.auth.verifyOtp(value);
  });
  // Relative Location keeps the exchange on the browser's actual origin. Never trust forwarded-host.
  const response = new NextResponse(null, {status:303,headers:{
    Location: destination,
    "Cache-Control":"private, no-store",
    "Referrer-Policy":"no-referrer",
  }});
  for (const {name,value,options} of writes) response.cookies.set(name,value,options);
  return response;
}
