import { Prisma, SchoolTransportRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextProtocol } from "@/lib/protocol";
import { audit } from "@/modules/audit/service";
import { notifyStudentGuardians } from "@/modules/notifications/service";

export async function createTransportRequest(input: { periodId: string; studentId: string; accessibilityNeed?: boolean; accessibilityInfo?: string; observations?: string; actorUserId: string }) {
  const now = new Date();
  const row = await prisma.$transaction(async tx => {
    const actor = await tx.user.findUniqueOrThrow({ where: { id: input.actorUserId }, select: { personId: true } });
    const period = await tx.schoolTransportPeriod.findUniqueOrThrow({
      where: { id: input.periodId },
      include: { schools: true, documentRequirements: { where: { active: true, required: true } } }
    });
    if (period.status !== "OPEN" || now < period.requestStart || now > period.requestEnd) throw new Error("PERIOD_CLOSED");

    const student = await tx.student.findFirst({
      where: {
        id: input.studentId,
        active: true,
        OR: [
          { personId: actor.personId },
          { guardians: { some: { guardian: { personId: actor.personId } } } }
        ]
      },
      select: { id: true, schoolId: true, grade: true, shift: true }
    });
    if (!student) throw new Error("STUDENT_NOT_OWNED");
    if (!student.schoolId) throw new Error("STUDENT_SCHOOL_REQUIRED");
    if (!student.grade || !student.shift) throw new Error("STUDENT_SCHOOL_DATA_REQUIRED");

    const address = await tx.address.findFirst({
      where: { personId: actor.personId, active: true },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true }
    });
    if (!address) throw new Error("ADDRESS_REQUIRED");

    const school = await tx.school.findFirst({ where: { id: student.schoolId, active: true }, select: { id: true } });
    if (!school) throw new Error("SCHOOL_NOT_AVAILABLE");
    if (period.schools.length > 0 && !period.schools.some(s => s.schoolId === student.schoolId)) throw new Error("SCHOOL_NOT_IN_PERIOD");

    const duplicate = await tx.schoolTransportRequest.findUnique({
      where: { periodId_studentId: { periodId: input.periodId, studentId: input.studentId } },
      select: { id: true }
    });
    if (duplicate) throw new Error("TRANSPORT_REQUEST_ALREADY_EXISTS");

    const protocol = await nextProtocol(tx, "TE", period.academicYear);
    const needsDocuments = period.documentRequirements.length > 0;
    const initialStatus: SchoolTransportRequestStatus = needsDocuments ? "DRAFT" : "SUBMITTED";

    return tx.schoolTransportRequest.create({
      data: {
        protocol,
        periodId: input.periodId,
        studentId: input.studentId,
        schoolId: student.schoolId,
        addressId: address.id,
        grade: student.grade,
        shift: student.shift,
        entryTime: null,
        exitTime: null,
        accessibilityNeed: Boolean(input.accessibilityNeed),
        accessibilityInfo: input.accessibilityInfo,
        observations: input.observations,
        status: initialStatus,
        submittedAt: needsDocuments ? null : now,
        history: { create: { toStatus: initialStatus, changedBy: input.actorUserId } }
      }
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  await audit({
    actorUserId: input.actorUserId,
    action: "CREATE",
    entityType: "school_transport_request",
    entityId: row.id,
    changedFields: ["status", "studentId", "schoolId", "addressId"],
    after: { protocol: row.protocol, status: row.status }
  });
  return row;
}

export const transitions: Record<SchoolTransportRequestStatus, SchoolTransportRequestStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELED"], SUBMITTED: ["UNDER_REVIEW", "CANCELED"], UNDER_REVIEW: ["PENDING", "APPROVED", "DENIED", "CANCELED"],
  PENDING: ["UNDER_REVIEW", "CANCELED"], APPROVED: ["ROUTE_DEFINED", "CANCELED"], DENIED: [], ROUTE_DEFINED: ["ACTIVE", "CANCELED"], ACTIVE: ["CANCELED"], CANCELED: []
};

export function canTransitionTransportRequest(from: SchoolTransportRequestStatus, to: SchoolTransportRequestStatus){return transitions[from].includes(to)}

export async function changeTransportRequestStatus(input: { requestId: string; toStatus: SchoolTransportRequestStatus; note?: string; actorUserId: string }) {
  const row = await prisma.$transaction(async tx => {
    const current = await tx.schoolTransportRequest.findUniqueOrThrow({ where: { id: input.requestId } });
    if (!canTransitionTransportRequest(current.status, input.toStatus)) throw new Error("INVALID_STATUS_TRANSITION");
    const updated = await tx.schoolTransportRequest.update({ where: { id: current.id }, data: { status: input.toStatus } });
    await tx.transportRequestHistory.create({ data: { requestId: current.id, fromStatus: current.status, toStatus: input.toStatus, note: input.note, changedBy: input.actorUserId } });
    return { current, updated };
  });
  await audit({ actorUserId: input.actorUserId, action: "STATUS_CHANGE", entityType: "school_transport_request", entityId: input.requestId, changedFields: ["status"], before: { status: row.current.status }, after: { status: row.updated.status } });
  await notifyStudentGuardians(row.updated.studentId, `Transporte escolar: ${input.toStatus}`, `A solicitação ${row.updated.protocol} foi atualizada para ${input.toStatus}.`);
  return row.updated;
}
