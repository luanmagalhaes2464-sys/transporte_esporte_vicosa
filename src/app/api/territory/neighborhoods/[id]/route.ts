import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  type: z.enum(["URBAN", "RURAL", "DISTRICT", "COMMUNITY", "OTHER"]).optional(),
  officialCode: z.string().trim().max(80).nullable().optional(),
  active: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional()
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("territory.manage");
    const { id } = await ctx.params;
    const current = await prisma.neighborhood.findUniqueOrThrow({ where: { id } });
    const v = schema.parse(await req.json());
    const data = { ...v, ...(v.name ? { normalizedName: normalizeText(v.name) } : {}) };
    const updated = await prisma.neighborhood.update({ where: { id }, data });
    await audit({ actorUserId: user.id, action: "UPDATE", entityType: "neighborhood", entityId: id, changedFields: Object.keys(v), before: { name: current.name, type: current.type, active: current.active }, after: { name: updated.name, type: updated.type, active: updated.active } });
    return NextResponse.json(updated);
  } catch (e) { return handleRouteError(e); }
}
