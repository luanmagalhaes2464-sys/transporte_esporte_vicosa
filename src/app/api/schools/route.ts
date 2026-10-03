import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() { return NextResponse.json(await prisma.school.findMany({ where: { active: true }, select: { id:true,name:true,code:true }, orderBy:{name:"asc"} })); }
