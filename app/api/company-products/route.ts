import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { companyProductSymbol } from "@/lib/company-products";
import { readCompanyProducts } from "@/lib/company-products.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Company product discovery is not enabled in this deployment.",
        403,
      );
    requireFeature(access, "advanced");
    const p = new URL(request.url).searchParams;
    const symbol = companyProductSymbol(p.get("symbol"));
    if (
      !symbol ||
      p.getAll("symbol").length !== 1 ||
      [...p.keys()].some((k) => k !== "symbol")
    )
      throw new HttpError("Choose one company ticker.", 400);
    await limit(`company-products:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", symbol);
    return privateJson(await readCompanyProducts(symbol));
  } catch (e) {
    return failure(e);
  }
}
