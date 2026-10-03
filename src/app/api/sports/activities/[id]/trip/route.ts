import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";
const schema=z.object({startAt:z.coerce.date(),endAt:z.coerce.date()});
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){try{const u=await requirePermission('sports.activity.manage');const{id}=await ctx.params;const v=schema.parse(await req.json());if(v.endAt<=v.startAt)throw new Error('INVALID_PERIOD');const a=await prisma.sportsActivity.findUniqueOrThrow({where:{id},include:{boardingPoints:{where:{active:true},orderBy:{name:'asc'}},trips:{where:{status:{not:'CANCELED'}},orderBy:{startAt:'desc'},take:1}}});if(!a.offersTransport)throw new Error('TRANSPORT_NOT_AVAILABLE');if(a.trips[0])return NextResponse.json(a.trips[0]);const origin=a.boardingPoints.length?a.boardingPoints.map(p=>p.name).join(' / '):'Ponto de embarque a definir';const row=await prisma.trip.create({data:{sportsActivityId:a.id,title:`Transporte · ${a.name}`,startAt:v.startAt,endAt:v.endAt,origin,destination:a.locationName,passengerCount:a.transportCapacity??a.capacity,responsibleName:a.responsibleName,responsiblePhone:a.contact}});await audit({actorUserId:u.id,action:'CREATE',entityType:'sports_trip',entityId:row.id,changedFields:['sportsActivityId','startAt','endAt'],after:{sportsActivityId:a.id,title:row.title}});return NextResponse.json(row,{status:201})}catch(e){return handleRouteError(e)}}
