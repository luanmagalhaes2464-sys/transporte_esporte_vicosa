import { EntityType, NeighborhoodType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";
import { audit } from "@/modules/audit/service";

export async function searchTerritory(query: string, municipalityId: string) {
  const q = normalizeText(query);
  if (q.length < 2) return [];
  const [neighborhoods, streets, rural, aliases] = await Promise.all([
    prisma.neighborhood.findMany({ where: { municipalityId, active: true, normalizedName: { contains: q } }, take: 8, orderBy: { name: "asc" } }),
    prisma.street.findMany({ where: { municipalityId, active: true, normalizedName: { contains: q } }, take: 8, orderBy: { name: "asc" }, include: { neighborhoods: { include: { neighborhood: true } } } }),
    prisma.ruralLocality.findMany({ where: { municipalityId, active: true, normalizedName: { contains: q } }, take: 8, orderBy: { name: "asc" }, include: { district: true } }),
    prisma.locationAlias.findMany({ where: { normalizedAlias: { contains: q } }, take: 12 })
  ]);
  const aliasTargets = await Promise.all(aliases.map(async a => {
    if (a.entityType === "NEIGHBORHOOD") {
      const row = await prisma.neighborhood.findFirst({ where: { id: a.entityId, municipalityId, active: true } });
      return row ? { type: "NEIGHBORHOOD", id: row.id, name: row.name, matchedAlias: a.alias } : null;
    }
    if (a.entityType === "STREET") {
      const row = await prisma.street.findFirst({ where: { id: a.entityId, municipalityId, active: true } });
      return row ? { type: "STREET", id: row.id, name: row.name, matchedAlias: a.alias } : null;
    }
    if (a.entityType === "RURAL_LOCALITY") {
      const row = await prisma.ruralLocality.findFirst({ where: { id: a.entityId, municipalityId, active: true } });
      return row ? { type: "RURAL_LOCALITY", id: row.id, name: row.name, matchedAlias: a.alias } : null;
    }
    if (a.entityType === "DISTRICT") {
      const row = await prisma.district.findFirst({ where: { id: a.entityId, municipalityId, active: true } });
      return row ? { type: "DISTRICT", id: row.id, name: row.name, matchedAlias: a.alias } : null;
    }
    return null;
  }));
  const rows = [
    ...neighborhoods.map(x => ({ type: "NEIGHBORHOOD", id: x.id, name: x.name })),
    ...streets.map(x => ({ type: "STREET", id: x.id, name: x.name, neighborhoods: x.neighborhoods.map(n => ({ id: n.neighborhood.id, name: n.neighborhood.name })) })),
    ...rural.map(x => ({ type: "RURAL_LOCALITY", id: x.id, name: x.name, district: x.district?.name ?? null })),
    ...aliasTargets.filter(Boolean)
  ];
  const seen = new Set<string>();
  return rows.filter(x => { const k = `${x!.type}:${x!.id}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 20);
}

export async function createNeighborhood(input: { municipalityId: string; name: string; type?: NeighborhoodType; actorUserId: string }) {
  const normalizedName = normalizeText(input.name);
  const row = await prisma.neighborhood.create({ data: { municipalityId: input.municipalityId, name: input.name.trim(), normalizedName, type: input.type ?? "URBAN" } });
  await audit({ actorUserId: input.actorUserId, action: "CREATE", entityType: "neighborhood", entityId: row.id, changedFields: ["name", "type"], after: { name: row.name, type: row.type } });
  return row;
}

export async function addAlias(input: { entityType: EntityType; entityId: string; alias: string; actorUserId: string }) {
  const target = input.entityType === "NEIGHBORHOOD" ? await prisma.neighborhood.findUnique({ where: { id: input.entityId }, select: { id: true } })
    : input.entityType === "STREET" ? await prisma.street.findUnique({ where: { id: input.entityId }, select: { id: true } })
    : input.entityType === "RURAL_LOCALITY" ? await prisma.ruralLocality.findUnique({ where: { id: input.entityId }, select: { id: true } })
    : await prisma.district.findUnique({ where: { id: input.entityId }, select: { id: true } });
  if (!target) throw new Error("TERRITORY_REFERENCE_INVALID");
  const row = await prisma.locationAlias.create({ data: { entityType: input.entityType, entityId: input.entityId, alias: input.alias.trim(), normalizedAlias: normalizeText(input.alias) } });
  await audit({ actorUserId: input.actorUserId, action: "CREATE", entityType: "location_alias", entityId: row.id, after: { entityType: row.entityType, alias: row.alias } });
  return row;
}

export async function mergeNeighborhoods(input: { sourceId: string; targetId: string; actorUserId: string }) {
  if (input.sourceId === input.targetId) throw new Error("SAME_LOCATION");
  return prisma.$transaction(async tx => {
    const [source, target] = await Promise.all([
      tx.neighborhood.findUniqueOrThrow({ where: { id: input.sourceId } }),
      tx.neighborhood.findUniqueOrThrow({ where: { id: input.targetId } })
    ]);
    if (source.municipalityId !== target.municipalityId) throw new Error("DIFFERENT_MUNICIPALITY");
    await tx.address.updateMany({ where: { neighborhoodId: source.id }, data: { neighborhoodId: target.id } });
    await tx.school.updateMany({ where: { neighborhoodId: source.id }, data: { neighborhoodId: target.id } });
    const links = await tx.streetNeighborhood.findMany({ where: { neighborhoodId: source.id } });
    for (const link of links) {
      await tx.streetNeighborhood.upsert({ where: { streetId_neighborhoodId: { streetId: link.streetId, neighborhoodId: target.id } }, update: {}, create: { streetId: link.streetId, neighborhoodId: target.id } });
    }
    await tx.streetNeighborhood.deleteMany({ where: { neighborhoodId: source.id } });
    await tx.locationAlias.updateMany({ where: { entityType: "NEIGHBORHOOD", entityId: source.id }, data: { entityId: target.id } });
    await tx.locationAlias.upsert({
      where: { entityType_entityId_normalizedAlias: { entityType: "NEIGHBORHOOD", entityId: target.id, normalizedAlias: source.normalizedName } },
      update: {}, create: { entityType: "NEIGHBORHOOD", entityId: target.id, alias: source.name, normalizedAlias: source.normalizedName }
    });
    await tx.neighborhood.update({ where: { id: source.id }, data: { active: false } });
    return { source, target };
  }).then(async result => {
    await audit({ actorUserId: input.actorUserId, action: "MERGE", entityType: "neighborhood", entityId: input.targetId, changedFields: ["relations", "aliases"], before: { merged: result.source.name }, after: { canonical: result.target.name } });
    return result.target;
  });
}
