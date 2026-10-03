import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
const schema = z.object({ extraRequestId: z.string().uuid().optional(), sportsActivityId: z.string().uuid().optional(), title: z.string().min(3), startAt: z.coerce.date(), endAt: z.coerce.date(), origin: z.string().min(2), destination: z.string().min(2), passengerCount: z.number().int().min(0), responsibleName: z.string().optional(), responsiblePhone: z.string().optional() });
export async function GET() { try { await requirePermission("fleet.trip.read"); return NextResponse.json(await prisma.trip.findMany({ include: { vehicles: { where: { active: true }, include: { vehicle: true } }, drivers: { where: { active: true }, include: { driver: { include: { person: true } } } } }, orderBy: { startAt: "asc" }, take: 500 })); } catch (e) { return handleRouteError(e); } }
export async function POST(req: NextRequest) { try { await requirePermission("extracurricular.request.review"); const v = schema.parse(await req.json()); if (v.endAt <= v.startAt) throw new Error("INVALID_PERIOD"); return NextResponse.json(await prisma.trip.create({ data: v }), { status: 201 }); } catch (e) { return handleRouteError(e); } }
