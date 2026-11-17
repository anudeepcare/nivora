import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";
test("saved snapshots reject a Free account before reading or returning protected payloads", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://snapshot.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "public-test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-test";
  process.env.AURYN_ACCESS_ENABLED = "true";
  process.env.AURYN_OWNER_USER_ID = "owner";
  process.env.AURYN_EXTERNAL_DATA_LICENSED = "true";
  let reads = 0;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/auth/v1/user")
      return Response.json({
        id: "free-user",
        email: "test@example.invalid",
        app_metadata: {},
        user_metadata: {},
      });
    if (url.pathname.endsWith("auryn_access_config"))
      return Response.json({ body: {}, enforced: true, owner_id: "owner" });
    if (
      url.pathname.endsWith("auryn_beta_grants") ||
      url.pathname.endsWith("auryn_stripe_subscriptions")
    )
      return Response.json(null);
    if (url.pathname.endsWith("auryn_observations")) {
      reads++;
      return Response.json([{ payload: { privateModel: true } }]);
    }
    throw Error("Unexpected " + url.pathname);
  };
  const { GET } = sourceModule("app/api/observations/route.ts");
  const r = await GET(
    new Request("https://auryn.invalid/api/observations", {
      headers: { Authorization: "Bearer test" },
    }),
  );
  assert.equal(r.status, 403);
  assert.equal(reads, 0);
});
