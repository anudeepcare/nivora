import { account, failure, privateJson, HttpError, limit } from "@/lib/server";
import { getAccess, reserveAccess } from "@/lib/access-server";
import { symbolInput } from "@/lib/format";
export async function POST(request: Request) {
  try {
    const { user } = await account(request);
    limit(`visit:${user.id}`, 20);
    const a = await getAccess(
      user.id,
      request.headers.get("x-auryn-preview-plan"),
    );
    if (!a.admitted)
      throw new HttpError("Private beta access is required.", 403);
    const body = await request.json(),
      symbol = symbolInput(body.symbol);
    await reserveAccess(user.id, a, "research", symbol);
    return privateJson({ allowed: true });
  } catch (e) {
    return failure(e);
  }
}
