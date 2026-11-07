import { account, failure, privateJson, HttpError } from "@/lib/server";
import { exactOwner } from "@/lib/access-server";
import { ownerHandbook } from "@/lib/owner-handbook-content";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: false });
    if (!exactOwner(user.id))
      throw new HttpError("Workspace owner access required.", 403);
    return privateJson({ title: "Owner handbook", content: ownerHandbook });
  } catch (error) {
    return failure(error);
  }
}
