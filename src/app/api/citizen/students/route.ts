import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { digitsOnly, isValidCpf } from "@/lib/normalize";
import { requireUser } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";

const RELATIONS = ["Pai","Mãe","Avô","Avó","Padrasto","Madrasta","Tio","Tia","Primo","Prima","Responsável legal","Outro"] as const;
const SHIFTS = ["Manhã","Tarde","Noite","Integral"] as const;

const schema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo do aluno."),
  cpf: z.string().optional().transform(v => v ? digitsOnly(v) : undefined),
  birthDate: z.string().min(1, "Informe a data de nascimento.").refine(v => !Number.isNaN(new Date(`${v}T12:00:00Z`).getTime()), "Informe uma data de nascimento válida."),
  schoolId: z.string().uuid("Selecione uma escola válida."),
  grade: z.string().trim().min(1, "Informe o ano/série do aluno."),
  shift: z.enum(SHIFTS, { message: "Selecione o turno do aluno." }),
  relation: z.enum(RELATIONS),
  relationOther: z.string().trim().max(80).optional()
}).superRefine((value, ctx) => {
  if (value.relation === "Outro" && !value.relationOther) {
    ctx.addIssue({ code: "custom", path: ["relationOther"], message: "Especifique sua relação com o aluno." });
  }
});

export async function GET() {
  try {
    const u = await requireUser();
    const [g,self] = await Promise.all([
      prisma.guardian.findFirst({ where: { personId: u.personId }, include: { students: { include: { student: { include: { person: true, school: true } } } } } }),
      prisma.student.findFirst({ where: { personId: u.personId, active: true }, include: { person: true, school: true } })
    ]);
    const rows = g?.students.map(x => x.student) ?? [];
    if (self && !rows.some(x => x.id === self.id)) rows.unshift(self);
    return NextResponse.json(rows);
  } catch (e) { return handleRouteError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireUser();
    const v = schema.parse(await req.json());
    if (v.cpf && !isValidCpf(v.cpf)) throw new Error("INVALID_CPF");

    const school = await prisma.school.findFirst({ where: { id: v.schoolId, active: true }, select: { id: true } });
    if (!school) throw new Error("SCHOOL_NOT_AVAILABLE");

    const relation = v.relation === "Outro" ? v.relationOther!.trim() : v.relation;
    const student = await prisma.$transaction(async tx => {
      const guardian = await tx.guardian.upsert({ where: { personId: u.personId }, update: {}, create: { personId: u.personId } });
      const p = await tx.person.create({ data: { fullName: v.fullName, cpf: v.cpf || null, birthDate: new Date(`${v.birthDate}T12:00:00Z`) } });
      const s = await tx.student.create({ data: { personId: p.id, schoolId: v.schoolId, grade: v.grade, shift: v.shift } });
      await tx.studentGuardian.create({ data: { studentId: s.id, guardianId: guardian.id, relation, primary: true } });
      return s;
    });
    return NextResponse.json(student, { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
