import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { digitsOnly, normalizeText } from "@/lib/normalize";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema = z.object({
  name: z.string().trim().min(2).max(180),
  type: z.string().trim().max(80).optional(),
  cep: z.string().optional(),
  neighborhoodIds: z.array(z.string().uuid()).max(20).default([]),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional()
});

async function municipalityId() {
  return (await prisma.systemSetting.findUniqueOrThrow({ where: { key: "default_municipality_id" } })).value;
}

export async function GET() {
  try {
    await requirePermission("territory.read");
    const municipalityIdValue = await municipalityId();
    return NextResponse.json(await prisma.street.findMany({ where: { municipalityId: municipalityIdValue }, include: { neighborhoods: { include: { neighborhood: true } } }, orderBy: { name: "asc" }, take: 2000 }));
  } catch (e) { return handleRouteError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("territory.manage");
    const v = schema.parse(await req.json());
    const municipalityIdValue = await municipalityId();
    const row = await prisma.$transaction(async tx => {
      if (v.neighborhoodIds.length) {
        const count = await tx.neighborhood.count({ where: { id: { in: v.neighborhoodIds }, municipalityId: municipalityIdValue, active: true } });
        if (count !== new Set(v.neighborhoodIds).size) throw new Error("TERRITORY_REFERENCE_INVALID");
      }
      return tx.street.create({
        data: {
          municipalityId: municipalityIdValue,
          name: v.name,
          normalizedName: normalizeText(v.name),
          type: v.type,
          cep: v.cep ? digitsOnly(v.cep) : undefined,
          latitude: v.latitude,
          longitude: v.longitude,
          neighborhoods: { create: [...new Set(v.neighborhoodIds)].map(neighborhoodId => ({ neighborhoodId })) }
        },
        include: { neighborhoods: { include: { neighborhood: true } } }
      });
    });
    await audit({ actorUserId: user.id, action: "CREATE", entityType: "street", entityId: row.id, changedFields: ["name", "neighborhoodIds"], after: { name: row.name } });
    return NextResponse.json(row, { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
