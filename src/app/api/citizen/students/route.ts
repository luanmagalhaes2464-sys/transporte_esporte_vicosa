import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { digitsOnly, isValidCpf } from "@/lib/normalize";
import { requireUser } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
const schema = z.object({ fullName:z.string().min(3), cpf:z.string().optional().transform(v=>v?digitsOnly(v):undefined), birthDate:z.string().date(), schoolId:z.string().uuid().optional(), grade:z.string().optional(), shift:z.string().optional(), relation:z.string().min(2).default("Responsável") });
export async function GET() {
  try { const u=await requireUser(); const g=await prisma.guardian.findFirst({where:{personId:u.personId},include:{students:{include:{student:{include:{person:true,school:true}}}}}}); return NextResponse.json(g?.students.map(x=>x.student)??[]); } catch(e){return handleRouteError(e)}
}
export async function POST(req:NextRequest){
  try{const u=await requireUser(); const v=schema.parse(await req.json()); if(v.cpf && !isValidCpf(v.cpf)) throw new Error("INVALID_CPF"); const student=await prisma.$transaction(async tx=>{const guardian=await tx.guardian.upsert({where:{personId:u.personId},update:{},create:{personId:u.personId}}); const p=await tx.person.create({data:{fullName:v.fullName,cpf:v.cpf||null,birthDate:new Date(`${v.birthDate}T12:00:00Z`)}}); const s=await tx.student.create({data:{personId:p.id,schoolId:v.schoolId,grade:v.grade,shift:v.shift}}); await tx.studentGuardian.create({data:{studentId:s.id,guardianId:guardian.id,relation:v.relation,primary:true}}); return s;}); return NextResponse.json(student,{status:201});}catch(e){return handleRouteError(e)}
}
