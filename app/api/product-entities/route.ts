import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { productQuery, productHandle } from "@/lib/product-entities";
import { readProductEntity } from "@/lib/product-entities.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Product lookup is not enabled in this deployment.",
        403,
      );
    requireFeature(access, "advanced");
    const params = new URL(request.url).searchParams,
      mode = params.get("mode"),
      value =
        mode === "search"
          ? productQuery(params.get("value"))
          : mode === "detail"
            ? productHandle(params.get("value"))
            : null;
    if (
      !value ||
      ["mode", "value"].some((k) => params.getAll(k).length !== 1) ||
      [...params.keys()].some((k) => !["mode", "value"].includes(k))
    )
      throw new HttpError(
        "Choose a product name or verified public product handle.",
        400,
      );
    await limit(`product-entities:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", "product-lookup");
    return privateJson(
      await readProductEntity(mode as "search" | "detail", value),
    );
  } catch (e) {
    return failure(e);
  }
}
