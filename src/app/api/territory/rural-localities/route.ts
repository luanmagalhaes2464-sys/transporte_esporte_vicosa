import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema = z.object({
  name: z.string().trim().min(2).max(180),
  popularName: z.string().trim().max(180).optional(),
  region: z.string().trim().max(180).optional(),
  districtId: z.string().uuid().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional()
});

async function municipalityId() { return (await prisma.systemSetting.findUniqueOrThrow({ where: { key: "default_municipality_id" } })).value; }

export async function GET() {
  try { await requirePermission("territory.read"); const municipalityIdValue = await municipalityId(); return NextResponse.json(await prisma.ruralLocality.findMany({ where: { municipalityId: municipalityIdValue }, include: { district: true }, orderBy: { name: "asc" }, take: 2000 })); }
  catch (e) { return handleRouteError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("territory.manage"); const v = schema.parse(await req.json()); const municipalityIdValue = await municipalityId();
    if (v.districtId && !(await prisma.district.findFirst({ where: { id: v.districtId, municipalityId: municipalityIdValue, active: true }, select: { id: true } }))) throw new Error("TERRITORY_REFERENCE_INVALID");
    const row = await prisma.ruralLocality.create({ data: { municipalityId: municipalityIdValue, name: v.name, normalizedName: normalizeText(v.name), popularName: v.popularName, region: v.region, districtId: v.districtId, latitude: v.latitude, longitude: v.longitude, locationPrecision: "RURAL_LOCALITY" } });
    await audit({ actorUserId: user.id, action: "CREATE", entityType: "rural_locality", entityId: row.id, changedFields: ["name", "districtId"], after: { name: row.name } });
    return NextResponse.json(row, { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
