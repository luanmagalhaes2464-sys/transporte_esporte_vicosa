import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
const schema = z.object({ identification: z.string().min(2), plate: z.string().min(7).max(10).transform(v => v.toUpperCase()), type: z.enum(["BUS","MINIBUS","VAN","OTHER"]), capacity: z.number().int().positive(), accessible: z.boolean().default(false), status: z.enum(["AVAILABLE","ON_TRIP","MAINTENANCE","UNAVAILABLE"]).default("AVAILABLE") });
export async function GET() { try { await requirePermission("fleet.trip.read"); return NextResponse.json(await prisma.vehicle.findMany({ where: { active: true }, orderBy: { identification: "asc" } })); } catch (e) { return handleRouteError(e); } }
export async function POST(req: NextRequest) { try { await requirePermission("fleet.vehicle.manage"); return NextResponse.json(await prisma.vehicle.create({ data: schema.parse(await req.json()) }), { status: 201 }); } catch (e) { return handleRouteError(e); } }
