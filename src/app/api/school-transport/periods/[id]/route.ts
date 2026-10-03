import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema=z.object({
  name:z.string().min(3),
  academicYear:z.number().int().min(2020).max(2100),
  requestStart:z.coerce.date(),
  requestEnd:z.coerce.date(),
  rules:z.string().optional(),
  status:z.enum(["DRAFT","SCHEDULED","OPEN","CLOSED"]),
  schoolIds:z.array(z.string().uuid()).max(500).default([]),
  documentRequirements:z.array(z.object({name:z.string().min(2).max(120),required:z.boolean().default(true)})).max(30).default([])
});

export async function PATCH(req:NextRequest,ctx:{params:Promise<{id:string}>}){
  try{
    const user=await requirePermission("school_transport.period.manage");
    const {id}=await ctx.params;
    const v=schema.parse(await req.json());
    if(v.requestEnd<=v.requestStart)throw new Error("INVALID_PERIOD");
    const schoolCount=v.schoolIds.length?await prisma.school.count({where:{id:{in:v.schoolIds},active:true}}):0;
    if(schoolCount!==new Set(v.schoolIds).size)throw new Error("SCHOOL_NOT_AVAILABLE");
    const uniqueDocs=[...new Map(v.documentRequirements.map(d=>[d.name.trim().toLocaleLowerCase("pt-BR"),{name:d.name.trim(),required:d.required}])).values()];

    const row=await prisma.$transaction(async tx=>{
      const updated=await tx.schoolTransportPeriod.update({where:{id},data:{name:v.name,academicYear:v.academicYear,requestStart:v.requestStart,requestEnd:v.requestEnd,rules:v.rules,status:v.status}});
      await tx.schoolTransportPeriodSchool.deleteMany({where:{periodId:id}});
      if(v.schoolIds.length)await tx.schoolTransportPeriodSchool.createMany({data:[...new Set(v.schoolIds)].map(schoolId=>({periodId:id,schoolId}))});
      await tx.transportDocumentRequirement.updateMany({where:{periodId:id},data:{active:false}});
      for(const d of uniqueDocs){
        const existing=await tx.transportDocumentRequirement.findFirst({where:{periodId:id,name:d.name}});
        if(existing)await tx.transportDocumentRequirement.update({where:{id:existing.id},data:{active:true,required:d.required}});
        else await tx.transportDocumentRequirement.create({data:{periodId:id,name:d.name,required:d.required,active:true}});
      }
      return updated;
    });
    await audit({actorUserId:user.id,action:"UPDATE",entityType:"school_transport_period",entityId:id,changedFields:["name","academicYear","requestStart","requestEnd","rules","status","schools","documentRequirements"],after:{status:row.status,documents:uniqueDocs.map(d=>d.name)}});
    return NextResponse.json(row);
  }catch(e){return handleRouteError(e)}
}
