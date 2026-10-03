import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/security/session";
import { handleRouteError, jsonError } from "@/lib/http";
import { rateLimit } from "@/security/rate-limit";

const schema = z.object({ email: z.string().email().transform(v => v.toLowerCase()), password: z.string().min(1).max(128) });

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!rateLimit(`login:${ip}`, 12, 60_000).ok) return jsonError("Muitas tentativas. Aguarde um minuto.", 429);
    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });
    if (!user || user.status !== "ACTIVE" || !(await argon2.verify(user.passwordHash, body.password))) return jsonError("E-mail ou senha inválidos.", 401);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession({ userId: user.id, email: user.email });

    const roles = new Set(user.roles.map(r => r.role.code));
    const permissions = new Set(user.roles.flatMap(r => r.role.permissions.map(p => p.permission.code)));
    let redirectTo = "/cidadao";
    if (roles.has("ADMIN") || roles.has("SECRETARIA") || ["school_transport.request.review","extracurricular.request.review","sports.activity.manage"].some(p => permissions.has(p))) redirectTo = "/admin";
    else if (roles.has("SCHOOL")) redirectTo = "/escola";
    else if (roles.has("DRIVER")) redirectTo = "/motorista";

    return NextResponse.json({ ok: true, redirectTo });
  } catch (e) { return handleRouteError(e); }
}
