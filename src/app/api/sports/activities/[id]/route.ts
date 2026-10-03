import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema=z.object({
  name:z.string().min(3).max(160),
  description:z.string().min(10),
  audience:z.string().max(240).optional(),
  minAge:z.number().int().min(0).max(120).optional(),
  maxAge:z.number().int().min(0).max(120).optional(),
  locationName:z.string().min(2).max(180),
  capacity:z.number().int().positive(),
  registrationStart:z.coerce.date(),
  registrationEnd:z.coerce.date(),
  activityStart:z.coerce.date(),
  activityEnd:z.coerce.date().optional(),
  responsibleName:z.string().max(160).optional(),
  contact:z.string().max(180).optional(),
  status:z.enum(["DRAFT","SCHEDULED","OPEN","CLOSED","CANCELED","COMPLETED"])
});

export async function PATCH(req:NextRequest,ctx:{params:Promise<{id:string}>}){
  try{
    const user=await requirePermission("sports.activity.manage");
    const {id}=await ctx.params;
    const v=schema.parse(await req.json());
    if(v.registrationEnd<=v.registrationStart||(v.activityEnd&&v.activityEnd<v.activityStart))throw new Error("INVALID_PERIOD");
    if(v.minAge!=null&&v.maxAge!=null&&v.maxAge<v.minAge)throw new Error("INVALID_PERIOD");
    const before=await prisma.sportsActivity.findUniqueOrThrow({where:{id}});
    const row=await prisma.sportsActivity.update({where:{id},data:v});
    await audit({actorUserId:user.id,action:"UPDATE",entityType:"sports_activity",entityId:id,changedFields:["name","description","audience","minAge","maxAge","locationName","capacity","registrationStart","registrationEnd","activityStart","activityEnd","responsibleName","contact","status"],before:{name:before.name,status:before.status,capacity:before.capacity},after:{name:row.name,status:row.status,capacity:row.capacity}});
    return NextResponse.json(row);
  }catch(e){return handleRouteError(e)}
}
