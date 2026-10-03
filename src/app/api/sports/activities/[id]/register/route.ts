import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/security/authorization";
import { registerForActivity } from "@/modules/sports/service";
import { handleRouteError } from "@/lib/http";
const schema = z.object({ participantPersonId: z.string().uuid().optional(), wantsTransport: z.boolean().default(false), boardingPointId: z.string().uuid().nullable().optional() });
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("sports.registration.create");
    const { id } = await context.params;
    const body = schema.parse(await req.json());
    return NextResponse.json(await registerForActivity({ activityId: id, userId: user.id, ...body }), { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
