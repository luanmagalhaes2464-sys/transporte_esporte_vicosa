import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
const schema=z.object({settings:z.record(z.string(),z.string()).refine(o=>Object.keys(o).length<=30)});
export async function GET(){try{await requirePermission('admin.manage');return NextResponse.json(Object.fromEntries((await prisma.systemSetting.findMany()).map(s=>[s.key,s.value])))}catch(e){return handleRouteError(e)}}
export async function PUT(req:NextRequest){try{await requirePermission('admin.manage');const{settings}=schema.parse(await req.json());for(const[key,value]of Object.entries(settings))await prisma.systemSetting.upsert({where:{key},update:{value},create:{key,value,public:['portal_name','portal_subtitle','municipality_name','primary_color','support_email'].includes(key)}});return NextResponse.json({ok:true})}catch(e){return handleRouteError(e)}}
