import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";
const schema=z.object({name:z.string().trim().min(2).max(180),latitude:z.number().min(-90).max(90).nullable().optional(),longitude:z.number().min(-180).max(180).nullable().optional()});
async function municipalityId(){return(await prisma.systemSetting.findUniqueOrThrow({where:{key:"default_municipality_id"}})).value}
export async function GET(){try{await requirePermission("territory.read");return NextResponse.json(await prisma.district.findMany({where:{municipalityId:await municipalityId()},orderBy:{name:"asc"}}))}catch(e){return handleRouteError(e)}}
export async function POST(req:NextRequest){try{const u=await requirePermission("territory.manage");const v=schema.parse(await req.json());const row=await prisma.district.create({data:{municipalityId:await municipalityId(),name:v.name,normalizedName:normalizeText(v.name),latitude:v.latitude,longitude:v.longitude}});await audit({actorUserId:u.id,action:"CREATE",entityType:"district",entityId:row.id,changedFields:["name"],after:{name:row.name}});return NextResponse.json(row,{status:201})}catch(e){return handleRouteError(e)}}
