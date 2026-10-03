import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { digitsOnly, normalizeText } from "@/lib/normalize";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema = z.object({
  name: z.string().trim().min(2).max(180).optional(),
  type: z.string().trim().max(80).nullable().optional(),
  cep: z.string().nullable().optional(),
  active: z.boolean().optional(),
  neighborhoodIds: z.array(z.string().uuid()).max(20).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional()
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("territory.manage");
    const { id } = await ctx.params;
    const current = await prisma.street.findUniqueOrThrow({ where: { id } });
    const v = schema.parse(await req.json());
    const updated = await prisma.$transaction(async tx => {
      if (v.neighborhoodIds) {
        const ids = [...new Set(v.neighborhoodIds)];
        const count = await tx.neighborhood.count({ where: { id: { in: ids }, municipalityId: current.municipalityId, active: true } });
        if (count !== ids.length) throw new Error("TERRITORY_REFERENCE_INVALID");
        await tx.streetNeighborhood.deleteMany({ where: { streetId: id } });
        if (ids.length) await tx.streetNeighborhood.createMany({ data: ids.map(neighborhoodId => ({ streetId: id, neighborhoodId })) });
      }
      return tx.street.update({ where: { id }, data: {
        name: v.name,
        normalizedName: v.name ? normalizeText(v.name) : undefined,
        type: v.type,
        cep: v.cep === undefined ? undefined : (v.cep ? digitsOnly(v.cep) : null),
        active: v.active,
        latitude: v.latitude,
        longitude: v.longitude
      }, include: { neighborhoods: { include: { neighborhood: true } } } });
    });
    await audit({ actorUserId: user.id, action: "UPDATE", entityType: "street", entityId: id, changedFields: Object.keys(v), before: { name: current.name, active: current.active }, after: { name: updated.name, active: updated.active } });
    return NextResponse.json(updated);
  } catch (e) { return handleRouteError(e); }
}
