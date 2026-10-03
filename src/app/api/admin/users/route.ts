import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
export async function GET(){try{await requirePermission('admin.manage');const rows=await prisma.user.findMany({select:{id:true,email:true,status:true,createdAt:true,person:{select:{fullName:true}},roles:{include:{role:true}},schoolMemberships:{where:{active:true},include:{school:true}}},orderBy:{person:{fullName:'asc'}},take:500});return NextResponse.json(rows)}catch(e){return handleRouteError(e)}}
