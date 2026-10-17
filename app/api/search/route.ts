import { account, failure, limit, privateJson } from "@/lib/server";
import { search } from "@/lib/providers";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    limit(`search:${user.id}`);
    const q = (new URL(request.url).searchParams.get("q") || "")
      .trim()
      .slice(0, 60);
    return privateJson({ results: q.length < 2 ? [] : await search(q) });
  } catch (e) {
    return failure(e);
  }
}
