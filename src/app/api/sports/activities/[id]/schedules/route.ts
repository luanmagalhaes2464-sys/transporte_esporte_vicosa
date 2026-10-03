import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";
const schema=z.object({weekday:z.number().int().min(0).max(6),startTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),endTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional()});
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){try{const u=await requirePermission('sports.activity.manage');const{id}=await ctx.params;await prisma.sportsActivity.findUniqueOrThrow({where:{id}});const v=schema.parse(await req.json());const row=await prisma.sportsActivitySchedule.create({data:{activityId:id,...v}});await audit({actorUserId:u.id,action:'CREATE',entityType:'sports_activity_schedule',entityId:row.id,changedFields:['weekday','startTime','endTime'],after:{activityId:id,weekday:v.weekday,startTime:v.startTime,endTime:v.endTime}});return NextResponse.json(row,{status:201})}catch(e){return handleRouteError(e)}}
