import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/security/authorization";
import { assignDriver } from "@/modules/fleet/service";
import { handleRouteError } from "@/lib/http";
const schema = z.object({ driverId: z.string().uuid() });
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) { try { const u = await requirePermission("extracurricular.trip.assign_driver"); const { id } = await context.params; const v = schema.parse(await req.json()); return NextResponse.json(await assignDriver({ tripId: id, driverId: v.driverId, actorUserId: u.id })); } catch (e) { return handleRouteError(e); } }
