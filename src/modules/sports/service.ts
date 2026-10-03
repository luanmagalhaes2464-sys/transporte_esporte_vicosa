import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextProtocol } from "@/lib/protocol";
import { audit } from "@/modules/audit/service";
import { notifyUser } from "@/modules/notifications/service";
import { ageOnDate } from "@/lib/normalize";

async function withSerializableRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2034") throw e;
    }
  }
  throw last;
}

async function allowedParticipant(tx: Prisma.TransactionClient, userId: string, participantPersonId?: string) {
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { personId: true } });
  const personId = participantPersonId ?? user.personId;
  if (personId === user.personId) return tx.person.findUniqueOrThrow({ where: { id: personId } });

  const dependent = await tx.student.findFirst({
    where: {
      personId,
      active: true,
      guardians: { some: { guardian: { personId: user.personId } } }
    },
    include: { person: true }
  });
  if (!dependent) throw new Error("SPORTS_PARTICIPANT_FORBIDDEN");
  return dependent.person;
}

export async function registerForActivity(input: { activityId: string; userId: string; participantPersonId?: string; wantsTransport?: boolean; boardingPointId?: string | null }) {
  const result = await withSerializableRetry(() => prisma.$transaction(async tx => {
    const activity = await tx.sportsActivity.findUniqueOrThrow({ where: { id: input.activityId }, include: { boardingPoints: { where: { active: true } } } });
    const now = new Date();
    if (activity.status !== "OPEN" || now < activity.registrationStart || now > activity.registrationEnd) throw new Error("REGISTRATION_CLOSED");

    const participant = await allowedParticipant(tx, input.userId, input.participantPersonId);
    if (participant.birthDate && (activity.minAge != null || activity.maxAge != null)) {
      const age = ageOnDate(participant.birthDate, activity.activityStart);
      if ((activity.minAge != null && age < activity.minAge) || (activity.maxAge != null && age > activity.maxAge)) throw new Error("AGE_REQUIREMENT_NOT_MET");
    }

    if (input.wantsTransport) {
      if (!activity.offersTransport) throw new Error("TRANSPORT_NOT_AVAILABLE");
      if (activity.boardingPoints.length > 0 && !input.boardingPointId) throw new Error("BOARDING_POINT_REQUIRED");
      if (input.boardingPointId) {
        const point = activity.boardingPoints.find(p => p.id === input.boardingPointId);
        if (!point) throw new Error("BOARDING_POINT_INVALID");
        if (point.capacity != null) {
          const pointUsed = await tx.sportsRegistration.count({ where: { activityId: input.activityId, boardingPointId: point.id, wantsTransport: true, status: "CONFIRMED" } });
          if (pointUsed >= point.capacity) throw new Error("TRANSPORT_FULL");
        }
      }
      if (activity.transportCapacity != null) {
        const transportUsed = await tx.sportsRegistration.count({ where: { activityId: input.activityId, status: "CONFIRMED", wantsTransport: true } });
        if (transportUsed >= activity.transportCapacity) throw new Error("TRANSPORT_FULL");
      }
    }

    const existing = await tx.sportsRegistration.findUnique({ where: { activityId_participantPersonId: { activityId: input.activityId, participantPersonId: participant.id } } });
    if (existing?.status === "CONFIRMED") return { kind: "registration" as const, row: existing };
    const existingWait = await tx.sportsWaitingList.findUnique({ where: { activityId_participantPersonId: { activityId: input.activityId, participantPersonId: participant.id } } });
    if (existingWait?.status === "WAITING") return { kind: "waiting" as const, row: existingWait };
    if (existingWait?.status === "CALLED" && existingWait.expiresAt && existingWait.expiresAt < now) {
      await tx.sportsWaitingList.update({ where: { id: existingWait.id }, data: { status: "EXPIRED" } });
    }

    const used = await tx.sportsRegistration.count({ where: { activityId: input.activityId, status: "CONFIRMED" } });
    const calledAndValid = existingWait?.status === "CALLED" && (!existingWait.expiresAt || existingWait.expiresAt >= now);
    if (used < activity.capacity && (!existingWait || calledAndValid || ["EXPIRED", "CANCELED"].includes(existingWait.status))) {
      const protocol = existing?.protocol ?? await nextProtocol(tx, activity.protocolPrefix || "ESP", now.getFullYear());
      const row = existing
        ? await tx.sportsRegistration.update({ where: { id: existing.id }, data: { status: "CONFIRMED", userId: input.userId, wantsTransport: Boolean(input.wantsTransport), boardingPointId: input.boardingPointId ?? null } })
        : await tx.sportsRegistration.create({ data: { activityId: input.activityId, userId: input.userId, participantPersonId: participant.id, wantsTransport: Boolean(input.wantsTransport), boardingPointId: input.boardingPointId ?? null, protocol } });
      if (existingWait) await tx.sportsWaitingList.update({ where: { id: existingWait.id }, data: { status: "CONFIRMED" } });
      return { kind: "registration" as const, row };
    }

    if (existingWait && ["EXPIRED", "CANCELED"].includes(existingWait.status)) {
      const last = await tx.sportsWaitingList.aggregate({ where: { activityId: input.activityId }, _max: { position: true } });
      const row = await tx.sportsWaitingList.update({ where: { id: existingWait.id }, data: { userId: input.userId, status: "WAITING", position: (last._max.position ?? 0) + 1, calledAt: null, expiresAt: null } });
      return { kind: "waiting" as const, row };
    }
    if (existingWait) return { kind: "waiting" as const, row: existingWait };
    const last = await tx.sportsWaitingList.aggregate({ where: { activityId: input.activityId }, _max: { position: true } });
    const row = await tx.sportsWaitingList.create({ data: { activityId: input.activityId, userId: input.userId, participantPersonId: participant.id, position: (last._max.position ?? 0) + 1 } });
    return { kind: "waiting" as const, row };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));

  await audit({ actorUserId: input.userId, action: "CREATE", entityType: result.kind === "registration" ? "sports_registration" : "sports_waiting_list", entityId: result.row.id, changedFields: ["activityId", "status", "participantPersonId"] });
  await notifyUser({ userId: input.userId, title: result.kind === "registration" ? "Inscrição confirmada" : "Lista de espera", message: result.kind === "registration" ? `Sua inscrição foi confirmada. Protocolo ${"protocol" in result.row ? result.row.protocol : ""}.` : `Você está na lista de espera na posição ${"position" in result.row ? result.row.position : ""}.`, email: true });
  return result;
}

export async function cancelSportsRegistration(registrationId: string, actorUserId: string) {
  const row = await prisma.$transaction(async tx => {
    const reg = await tx.sportsRegistration.update({ where: { id: registrationId }, data: { status: "CANCELED" } });
    const next = await tx.sportsWaitingList.findFirst({ where: { activityId: reg.activityId, status: "WAITING" }, orderBy: { position: "asc" } });
    if (next) await tx.sportsWaitingList.update({ where: { id: next.id }, data: { status: "CALLED", calledAt: new Date(), expiresAt: new Date(Date.now() + 48 * 3600_000) } });
    return { reg, next };
  });
  await audit({ actorUserId, action: "STATUS_CHANGE", entityType: "sports_registration", entityId: row.reg.id, changedFields: ["status"], after: { status: "CANCELED" } });
  if (row.next) await notifyUser({ userId: row.next.userId, title: "Vaga liberada", message: "Uma vaga foi liberada. Confirme sua inscrição no portal dentro de 48 horas.", email: true });
  return row.reg;
}

export async function cancelWaitingEntry(waitingId: string, actorUserId: string) {
  const row = await prisma.sportsWaitingList.update({ where: { id: waitingId }, data: { status: "CANCELED" } });
  await audit({ actorUserId, action: "STATUS_CHANGE", entityType: "sports_waiting_list", entityId: row.id, changedFields: ["status"], after: { status: "CANCELED" } });
  return row;
}

export async function callNextWaiting(activityId: string, actorUserId: string) {
  const result = await prisma.$transaction(async tx => {
    const activity = await tx.sportsActivity.findUniqueOrThrow({ where: { id: activityId } });
    const used = await tx.sportsRegistration.count({ where: { activityId, status: "CONFIRMED" } });
    if (used >= activity.capacity) throw new Error("NO_SPORTS_VACANCY");
    const next = await tx.sportsWaitingList.findFirst({ where: { activityId, status: "WAITING" }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
    if (!next) throw new Error("WAITLIST_EMPTY");
    return tx.sportsWaitingList.update({ where: { id: next.id }, data: { status: "CALLED", calledAt: new Date(), expiresAt: new Date(Date.now() + 48 * 3600_000) } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  await audit({ actorUserId, action: "STATUS_CHANGE", entityType: "sports_waiting_list", entityId: result.id, changedFields: ["status", "calledAt", "expiresAt"], after: { status: "CALLED" } });
  await notifyUser({ userId: result.userId, title: "Vaga liberada", message: "Uma vaga foi liberada. Confirme sua inscrição no portal em até 48 horas.", email: true });
  return result;
}
