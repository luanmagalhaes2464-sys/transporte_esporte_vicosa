import { prisma } from "@/lib/prisma";
import { readSession } from "@/security/session";

export async function currentUser() {
  const session = await readSession();
  if (!session) return null;
  return prisma.user.findFirst({
    where: { id: session.userId, status: "ACTIVE" },
    include: {
      person: true,
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      schoolMemberships: { where: { active: true }, include: { school: true } }
    }
  });
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function permissionSet(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  return new Set(user.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.code)));
}

export async function requirePermission(code: string) {
  const user = await requireUser();
  if (!permissionSet(user).has(code)) throw new Error("FORBIDDEN");
  return user;
}

export async function hasPermission(code: string) {
  const user = await currentUser();
  return Boolean(user && permissionSet(user).has(code));
}
