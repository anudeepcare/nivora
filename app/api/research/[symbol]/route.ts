import {requestAccess,reserveAccess} from "@/lib/access-server";
import {projectResearch} from "@/lib/access-policy";
import { canonical } from "@/lib/canonical";
import { account, failure, limit, privateJson } from "@/lib/server";
import { research } from "@/lib/providers";
import { symbolInput } from "@/lib/format";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request);
    limit(`research:${user.id}`, 12);
    const symbol = symbolInput((await params).symbol);
    const access=await requestAccess(request,user.id);
    await reserveAccess(user.id,access,"research",symbol);
    const data = await research(symbol);
    return privateJson(projectResearch({ ...data, snapshot: canonical(data) },access));
  } catch (e) {
    return failure(e);
  }
}
