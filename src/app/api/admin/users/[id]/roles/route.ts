import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
const schema=z.object({roles:z.array(z.string()).max(20)});
export async function PUT(req:NextRequest,ctx:{params:Promise<{id:string}>}){try{const actor=await requirePermission('admin.manage');const{id}=await ctx.params;if(id===actor.id)throw new Error('CANNOT_EDIT_OWN_ROLES');const v=schema.parse(await req.json());const roles=await prisma.role.findMany({where:{code:{in:v.roles},active:true}});await prisma.$transaction(async tx=>{await tx.userRole.deleteMany({where:{userId:id}});if(roles.length)await tx.userRole.createMany({data:roles.map(r=>({userId:id,roleId:r.id}))})});return NextResponse.json({ok:true})}catch(e){return handleRouteError(e)}}
