import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
const schema=z.object({name:z.string().min(3).max(160),code:z.string().max(40).optional(),phone:z.string().max(30).optional(),director:z.string().max(160).optional(),coordinator:z.string().max(160).optional(),openingHours:z.string().max(500).optional(),neighborhoodId:z.string().uuid().nullable().optional(),latitude:z.number().min(-90).max(90).nullable().optional(),longitude:z.number().min(-180).max(180).nullable().optional()});
export async function GET(){try{await requirePermission('school.read');return NextResponse.json(await prisma.school.findMany({where:{active:true},include:{neighborhood:true},orderBy:{name:'asc'}}))}catch(e){return handleRouteError(e)}}
export async function POST(req:NextRequest){try{await requirePermission('school.manage');const v=schema.parse(await req.json());const m=await prisma.systemSetting.findUniqueOrThrow({where:{key:'default_municipality_id'}});return NextResponse.json(await prisma.school.create({data:{municipalityId:m.value,...v}}),{status:201})}catch(e){return handleRouteError(e)}}
