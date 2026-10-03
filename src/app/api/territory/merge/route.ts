import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mergeNeighborhoods } from "@/modules/territory/service";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
const schema = z.object({ sourceId: z.string().uuid(), targetId: z.string().uuid() });
export async function POST(req: NextRequest) {
  try { const u = await requirePermission("territory.merge"); const v = schema.parse(await req.json()); return NextResponse.json(await mergeNeighborhoods({ ...v, actorUserId: u.id })); }
  catch (e) { return handleRouteError(e); }
}
