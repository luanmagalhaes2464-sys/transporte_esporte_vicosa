import { NextRequest,NextResponse } from "next/server";
import { ExtraRequestStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";
const schema=z.object({status:z.enum(["REQUESTED","UNDER_REVIEW","PENDING","APPROVED","VEHICLE_DEFINED","DRIVER_DEFINED","DRIVER_CONFIRMED","COMPLETED","DENIED","CANCELED"]),note:z.string().max(2000).optional()});
const next:Record<ExtraRequestStatus,ExtraRequestStatus[]>={REQUESTED:['UNDER_REVIEW','PENDING','DENIED','CANCELED'],UNDER_REVIEW:['PENDING','APPROVED','DENIED','CANCELED'],PENDING:['UNDER_REVIEW','APPROVED','DENIED','CANCELED'],APPROVED:['VEHICLE_DEFINED','CANCELED'],VEHICLE_DEFINED:['DRIVER_DEFINED','CANCELED'],DRIVER_DEFINED:['DRIVER_CONFIRMED','CANCELED'],DRIVER_CONFIRMED:['COMPLETED','CANCELED'],COMPLETED:[],DENIED:[],CANCELED:[]};
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){try{const u=await requirePermission('extracurricular.request.review');const{id}=await ctx.params;const v=schema.parse(await req.json());const current=await prisma.extracurricularRequest.findUniqueOrThrow({where:{id}});if(!next[current.status].includes(v.status))throw new Error('INVALID_STATUS_TRANSITION');const row=await prisma.$transaction(async tx=>{const updated=await tx.extracurricularRequest.update({where:{id},data:{status:v.status}});await tx.extraRequestHistory.create({data:{requestId:id,fromStatus:current.status,toStatus:v.status,note:v.note,changedBy:u.id}});return updated});await audit({actorUserId:u.id,action:'STATUS_CHANGE',entityType:'extracurricular_request',entityId:id,changedFields:['status'],before:{status:current.status},after:{status:v.status}});return NextResponse.json(row)}catch(e){return handleRouteError(e)}}
