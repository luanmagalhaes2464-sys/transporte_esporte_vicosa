import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
const schema=z.object({name:z.string().min(2).max(80),description:z.string().max(500).optional()});
export async function GET(){return NextResponse.json(await prisma.sportsCategory.findMany({where:{active:true},orderBy:{name:'asc'}}))}
export async function POST(req:NextRequest){try{await requirePermission('sports.activity.manage');return NextResponse.json(await prisma.sportsCategory.create({data:schema.parse(await req.json())}),{status:201})}catch(e){return handleRouteError(e)}}
