import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { parseHoldingsCsv } from "@/lib/planning";
export async function POST(request: Request) {
  try {
    const { user, db } = await account(request);
    limit(`import:${user.id}`, 2);
    const body = await request.json();
    if (
      !Array.isArray(body.rows) ||
      !body.rows.length ||
      body.rows.length > 200
    )
      throw new HttpError("Import one to two hundred validated rows.");
    const csv = [
      "symbol,quantity,cost,currency",
      ...body.rows.map((r: any) => {
        if (
          !r ||
          Object.values(r).some(
            (v) => typeof v === "string" && /[\n\r,"]/.test(v),
          )
        )
          throw new HttpError("Invalid import value.");
        return [r.symbol, r.quantity, r.cost, r.currency].join(",");
      }),
    ].join("\n");
    let rows;
    try {
      rows = parseHoldingsCsv(csv);
    } catch (e) {
      throw new HttpError(e instanceof Error ? e.message : "Invalid import.");
    }
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        String(body.requestId),
      )
    )
      throw new HttpError("Import identifier is required. Re-select the file.");
    const result = await db.rpc("auryn_import_positions", {
      p_request: body.requestId,
      p_rows: rows,
    });
    if (result.error)
      throw new HttpError("The import failed; no new rows were saved.", 503);
    return privateJson({ imported: result.data });
  } catch (e) {
    return failure(e);
  }
}
