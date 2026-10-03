import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
const schema=z.object({schoolIds:z.array(z.string().uuid()).max(50)});
export async function PUT(req:NextRequest,ctx:{params:Promise<{id:string}>}){try{await requirePermission('admin.manage');const{id}=await ctx.params;const v=schema.parse(await req.json());await prisma.$transaction(async tx=>{await tx.schoolUser.deleteMany({where:{userId:id}});if(v.schoolIds.length)await tx.schoolUser.createMany({data:v.schoolIds.map(schoolId=>({userId:id,schoolId}))})});return NextResponse.json({ok:true})}catch(e){return handleRouteError(e)}}
