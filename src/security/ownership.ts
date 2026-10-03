import { prisma } from "@/lib/prisma";
import type { currentUser } from "@/security/authorization";

type User = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function ownsTransportRequest(user: User, requestId: string) {
  return Boolean(await prisma.schoolTransportRequest.findFirst({
    where: {
      id: requestId,
      student: {
        OR: [
          { personId: user.personId },
          { guardians: { some: { guardian: { personId: user.personId } } } }
        ]
      }
    },
    select: { id: true }
  }));
}

export async function ownsExtracurricularRequest(user: User, requestId: string) {
  if (await prisma.extracurricularRequest.findFirst({ where: { id: requestId, createdById: user.id }, select: { id: true } })) return true;
  const schoolIds = user.schoolMemberships.map(m => m.schoolId);
  if (!schoolIds.length) return false;
  return Boolean(await prisma.extracurricularRequest.findFirst({ where: { id: requestId, schoolId: { in: schoolIds } }, select: { id: true } }));
}

export async function ownsSportsRegistration(user: User, registrationId: string) {
  return Boolean(await prisma.sportsRegistration.findFirst({ where: { id: registrationId, userId: user.id }, select: { id: true } }));
}
