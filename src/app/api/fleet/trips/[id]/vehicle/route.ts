import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/security/authorization";
import { assignVehicle } from "@/modules/fleet/service";
import { handleRouteError } from "@/lib/http";
const schema = z.object({ vehicleId: z.string().uuid() });
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) { try { const u = await requirePermission("extracurricular.trip.assign_vehicle"); const { id } = await context.params; const v = schema.parse(await req.json()); return NextResponse.json(await assignVehicle({ tripId: id, vehicleId: v.vehicleId, actorUserId: u.id })); } catch (e) { return handleRouteError(e); } }
