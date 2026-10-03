import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createNeighborhood } from "@/modules/territory/service";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
const schema = z.object({ name: z.string().min(2).max(120), type: z.enum(["URBAN", "RURAL", "DISTRICT", "COMMUNITY", "OTHER"]).default("URBAN") });
export async function GET() {
  await requirePermission("territory.read");
  const m = await prisma.systemSetting.findUniqueOrThrow({ where: { key: "default_municipality_id" } });
  return NextResponse.json(await prisma.neighborhood.findMany({ where: { municipalityId: m.value, active: true }, orderBy: { name: "asc" } }));
}
export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("territory.manage");
    const input = schema.parse(await req.json());
    const m = await prisma.systemSetting.findUniqueOrThrow({ where: { key: "default_municipality_id" } });
    return NextResponse.json(await createNeighborhood({ municipalityId: m.value, name: input.name, type: input.type, actorUserId: user.id }), { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
