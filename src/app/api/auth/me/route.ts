import { NextResponse } from "next/server";
import { currentUser, permissionSet } from "@/security/authorization";
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: user.id, email: user.email, fullName: user.person.fullName, roles: user.roles.map(r => r.role.code), permissions: [...permissionSet(user)], schools: user.schoolMemberships.map(s => ({ id: s.school.id, name: s.school.name })) } });
}
