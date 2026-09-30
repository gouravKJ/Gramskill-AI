import { handler, ok } from "@/lib/api/http";
import { buildMapData } from "@/lib/server/map-data";

export const dynamic = "force-dynamic";

/** GET /api/map — synthetic markers for the Local Opportunity Map. */
export const GET = handler(async () => {
  const data = await buildMapData();
  return ok(data);
});
