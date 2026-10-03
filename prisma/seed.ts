import { PrismaClient, NeighborhoodType, SportsActivityStatus, VehicleStatus, VehicleType } from "@prisma/client";
import argon2 from "argon2";
import { normalizeText } from "../src/lib/normalize";

const prisma = new PrismaClient();

const permissionCodes = [
  "profile.read", "profile.update",
  "territory.read", "territory.manage", "territory.import", "territory.merge",
  "school.read", "school.manage",
  "school_transport.request.create", "school_transport.request.read_own", "school_transport.request.review", "school_transport.request.approve", "school_transport.period.manage",
  "extracurricular.request.create", "extracurricular.request.review", "extracurricular.trip.assign_vehicle", "extracurricular.trip.assign_driver",
  "fleet.vehicle.manage", "fleet.driver.manage", "fleet.trip.read", "fleet.trip.execute",
  "sports.activity.read", "sports.activity.manage", "sports.registration.create", "sports.registration.manage",
  "citizens.read", "reports.read", "audit.read", "admin.manage"
];

const roles: Record<string, string[]> = {
  CITIZEN: ["profile.read", "profile.update", "school_transport.request.create", "school_transport.request.read_own", "sports.activity.read", "sports.registration.create"],
  SCHOOL: ["profile.read", "school.read", "extracurricular.request.create", "fleet.trip.read"],
  EDUCATION: ["profile.read", "territory.read", "school.read", "school_transport.request.review", "school_transport.request.approve", "school_transport.period.manage", "reports.read"],
  TRANSPORT: ["profile.read", "territory.read", "extracurricular.request.review", "extracurricular.trip.assign_vehicle", "extracurricular.trip.assign_driver", "fleet.vehicle.manage", "fleet.driver.manage", "fleet.trip.read", "reports.read"],
  DRIVER: ["profile.read", "fleet.trip.read", "fleet.trip.execute"],
  SPORTS: ["profile.read", "territory.read", "sports.activity.read", "sports.activity.manage", "sports.registration.manage", "reports.read"],
  ADMIN: permissionCodes
};

async function main() {
  const municipality = await prisma.municipality.upsert({
    where: { name_state: { name: "Viçosa", state: "MG" } },
    update: { active: true },
    create: { name: "Viçosa", state: "MG", ibgeCode: "3171303" }
  });

  const settings = {
    portal_name: "Portal Viçosa",
    portal_subtitle: "Educação, Transporte e Esporte",
    municipality_name: "Prefeitura Municipal de Viçosa – MG",
    primary_color: "#B51F2A",
    support_email: "",
    territory_restriction_enabled: "true",
    default_municipality_id: municipality.id
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value, public: true } });
  }

  for (const code of permissionCodes) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code, name: code } });
  }

  for (const [code, perms] of Object.entries(roles)) {
    const role = await prisma.role.upsert({ where: { code }, update: { active: true }, create: { code, name: code } });
    const permissionRows = await prisma.permission.findMany({ where: { code: { in: perms } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({ data: permissionRows.map(p => ({ roleId: role.id, permissionId: p.id })) });
  }

  const neighborhoods = ["Centro", "Nova Viçosa", "Novo Silvestre", "São José do Triunfo"];
  for (const name of neighborhoods) {
    await prisma.neighborhood.upsert({
      where: { municipalityId_normalizedName_type: { municipalityId: municipality.id, normalizedName: normalizeText(name), type: NeighborhoodType.URBAN } },
      update: { name, active: true },
      create: { municipalityId: municipality.id, name, normalizedName: normalizeText(name), type: NeighborhoodType.URBAN }
    });
  }

  const centro = await prisma.neighborhood.findFirstOrThrow({ where: { municipalityId: municipality.id, normalizedName: normalizeText("Centro") } });
  const escola = await prisma.school.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: { id: "00000000-0000-0000-0000-000000000101", municipalityId: municipality.id, name: "Escola Municipal Exemplo", code: "EX-001", neighborhoodId: centro.id, active: true }
  });

  await prisma.vehicle.upsert({
    where: { plate: "ABC1D23" }, update: {},
    create: { identification: "Ônibus 04", plate: "ABC1D23", type: VehicleType.BUS, capacity: 44, accessible: true, status: VehicleStatus.AVAILABLE }
  });

  const cat = await prisma.sportsCategory.upsert({ where: { name: "Futsal" }, update: {}, create: { name: "Futsal" } });
  await prisma.sportsActivity.upsert({
    where: { slug: "futsal-sub-15-exemplo" },
    update: {},
    create: {
      categoryId: cat.id,
      name: "Futsal Sub-15",
      slug: "futsal-sub-15-exemplo",
      description: "Atividade fictícia para demonstração do sistema.",
      minAge: 12,
      maxAge: 15,
      locationName: "Ginásio Municipal Exemplo",
      capacity: 30,
      registrationStart: new Date("2026-09-01T00:00:00-03:00"),
      registrationEnd: new Date("2026-10-15T23:59:59-03:00"),
      activityStart: new Date("2026-10-20T18:00:00-03:00"),
      status: SportsActivityStatus.OPEN
    }
  });

  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
    const person = await prisma.person.create({ data: { fullName: "Administrador de Teste", email } });
    const user = await prisma.user.create({ data: { personId: person.id, email, passwordHash: await argon2.hash(process.env.SEED_ADMIN_PASSWORD) } });
    const admin = await prisma.role.findUniqueOrThrow({ where: { code: "ADMIN" } });
    await prisma.userRole.create({ data: { userId: user.id, roleId: admin.id } });
  }

  console.log(`Seed concluído para ${municipality.name}. Escola exemplo: ${escola.name}`);
}

main().finally(() => prisma.$disconnect());
