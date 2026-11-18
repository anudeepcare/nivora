import "server-only";
import { readIndependentOriginEvidence } from "./independent-evidence-origin.server";
import type { IndependentEvidenceRequest } from "./independent-pace-adapter";
/** Earlier inactive entry name, now requiring the same authenticated origin
 * boundary. No route/component consumes it; no bare-provider bypass remains. */
export async function readIndependentEodEvidence(
  request: Request,
  input: IndependentEvidenceRequest,
) {
  return readIndependentOriginEvidence(request, input);
}
