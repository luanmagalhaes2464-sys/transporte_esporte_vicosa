import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";
const schema=z.object({name:z.string().min(2).max(160),address:z.string().max(240).optional(),latitude:z.number().min(-90).max(90).optional(),longitude:z.number().min(-180).max(180).optional(),capacity:z.number().int().positive().optional()});
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){try{const u=await requirePermission('sports.activity.manage');const{id}=await ctx.params;const activity=await prisma.sportsActivity.findUniqueOrThrow({where:{id}});if(!activity.offersTransport)throw new Error('TRANSPORT_NOT_AVAILABLE');const v=schema.parse(await req.json());const row=await prisma.sportsBoardingPoint.create({data:{activityId:id,...v}});await audit({actorUserId:u.id,action:'CREATE',entityType:'sports_boarding_point',entityId:row.id,changedFields:['name','capacity'],after:{activityId:id,name:v.name,capacity:v.capacity}});return NextResponse.json(row,{status:201})}catch(e){return handleRouteError(e)}}
