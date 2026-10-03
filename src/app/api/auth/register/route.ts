import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ageOnDate, digitsOnly, isValidCpf } from "@/lib/normalize";
import { createSession } from "@/security/session";
import { handleRouteError, jsonError } from "@/lib/http";
import { rateLimit } from "@/security/rate-limit";

const RELATIONS = ["Pai","Mãe","Avô","Avó","Padrasto","Madrasta","Tio","Tia","Primo","Prima","Responsável legal","Outro"] as const;

const schema = z.object({
  fullName: z.string().trim().min(3, "Informe seu nome completo.").max(160),
  cpf: z.string().transform(digitsOnly).refine(isValidCpf, "CPF inválido."),
  birthDate: z.string().min(1, "Informe a data de nascimento.").refine(v => !Number.isNaN(new Date(`${v}T12:00:00Z`).getTime()), "Informe uma data de nascimento válida."),
  email: z.string().email("Informe um e-mail válido.").transform(v => v.toLowerCase()),
  phone: z.string().trim().min(8, "Informe um telefone válido.").max(24),
  password: z.string().min(10, "A senha deve ter pelo menos 10 caracteres.").max(128),
  guardianFullName: z.string().trim().max(160).optional(),
  guardianCpf: z.string().optional().transform(v => v ? digitsOnly(v) : undefined),
  guardianPhone: z.string().trim().max(24).optional(),
  guardianRelation: z.enum(RELATIONS).optional(),
  guardianRelationOther: z.string().trim().max(80).optional()
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!rateLimit(`register:${ip}`, 8, 60_000).ok) return jsonError("Muitas tentativas. Aguarde um minuto.", 429);
    const body = schema.parse(await req.json());
    const birthDate = new Date(`${body.birthDate}T12:00:00Z`);
    const isMinor = ageOnDate(birthDate) < 18;

    if (isMinor) {
      if (!body.guardianFullName || !body.guardianCpf || !body.guardianPhone || !body.guardianRelation) {
        return jsonError("Para menores de 18 anos, informe todos os dados do responsável.", 422, "GUARDIAN_REQUIRED");
      }
      if (body.guardianRelation === "Outro" && !body.guardianRelationOther) {
        return jsonError("Especifique a relação do responsável com o aluno.", 422, "GUARDIAN_RELATION_REQUIRED");
      }
      if (!isValidCpf(body.guardianCpf)) return jsonError("CPF do responsável inválido.", 422, "INVALID_GUARDIAN_CPF");
      if (body.guardianCpf === body.cpf) return jsonError("O CPF do responsável deve ser diferente do CPF do menor.", 422, "GUARDIAN_CPF_SAME_AS_MINOR");
    }

    const [emailExists, cpfExists] = await Promise.all([
      prisma.user.findUnique({ where: { email: body.email }, select: { id: true } }),
      prisma.person.findUnique({ where: { cpf: body.cpf }, select: { id: true } })
    ]);
    if (emailExists) return jsonError("Já existe uma conta com este e-mail.", 409);
    if (cpfExists) return jsonError("CPF já cadastrado.", 409);

    if (isMinor && body.guardianCpf) {
      const guardianExists = await prisma.person.findUnique({ where: { cpf: body.guardianCpf }, select: { id: true, user: { select: { id: true } } } });
      if (guardianExists) return jsonError("O responsável informado já possui cadastro. Entre com a conta do responsável e adicione o menor como dependente.", 409, "GUARDIAN_ALREADY_REGISTERED");
    }

    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    const user = await prisma.$transaction(async tx => {
      const person = await tx.person.create({ data: { fullName: body.fullName, cpf: body.cpf, birthDate, phone: body.phone, email: body.email } });
      const user = await tx.user.create({ data: { personId: person.id, email: body.email, passwordHash } });
      const role = await tx.role.findUniqueOrThrow({ where: { code: "CITIZEN" } });
      await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });

      if (isMinor && body.guardianCpf && body.guardianFullName && body.guardianPhone && body.guardianRelation) {
        const relation = body.guardianRelation === "Outro" ? body.guardianRelationOther!.trim() : body.guardianRelation;
        const student = await tx.student.create({ data: { personId: person.id } });
        const guardianPerson = await tx.person.create({ data: { fullName: body.guardianFullName, cpf: body.guardianCpf, phone: body.guardianPhone } });
        const guardian = await tx.guardian.create({ data: { personId: guardianPerson.id } });
        await tx.studentGuardian.create({ data: { studentId: student.id, guardianId: guardian.id, relation, primary: true } });
      }
      return user;
    });
    await createSession({ userId: user.id, email: user.email });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
