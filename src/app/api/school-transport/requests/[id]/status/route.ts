import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/security/authorization";
import { changeTransportRequestStatus } from "@/modules/school-transport/service";
import { handleRouteError } from "@/lib/http";
const schema = z.object({ status: z.enum(["DRAFT","SUBMITTED","UNDER_REVIEW","PENDING","APPROVED","DENIED","ROUTE_DEFINED","ACTIVE","CANCELED"]), note: z.string().max(2000).optional() });
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { const user = await requirePermission("school_transport.request.review"); const { id } = await context.params; const v = schema.parse(await req.json()); return NextResponse.json(await changeTransportRequestStatus({ requestId: id, toStatus: v.status, note: v.note, actorUserId: user.id })); }
  catch (e) { return handleRouteError(e); }
}
