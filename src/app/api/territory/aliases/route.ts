import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { addAlias } from "@/modules/territory/service";
import { handleRouteError } from "@/lib/http";
const schema = z.object({ entityType: z.enum(["NEIGHBORHOOD","RURAL_LOCALITY","STREET","DISTRICT"]), entityId: z.string().uuid(), alias: z.string().min(2).max(180) });

export async function GET(){
  try{
    await requirePermission("territory.read");
    const rows=await prisma.locationAlias.findMany({orderBy:{alias:"asc"},take:2000});
    const enriched=await Promise.all(rows.map(async r=>{
      const target=r.entityType==="NEIGHBORHOOD"?await prisma.neighborhood.findUnique({where:{id:r.entityId},select:{name:true}})
        :r.entityType==="STREET"?await prisma.street.findUnique({where:{id:r.entityId},select:{name:true}})
        :r.entityType==="RURAL_LOCALITY"?await prisma.ruralLocality.findUnique({where:{id:r.entityId},select:{name:true}})
        :await prisma.district.findUnique({where:{id:r.entityId},select:{name:true}});
      return {...r,targetName:target?.name??"Registro indisponível"};
    }));
    return NextResponse.json(enriched);
  }catch(e){return handleRouteError(e)}
}
export async function POST(req: NextRequest) { try { const u = await requirePermission("territory.manage"); const v = schema.parse(await req.json()); return NextResponse.json(await addAlias({ ...v, actorUserId: u.id }), { status: 201 }); } catch (e) { return handleRouteError(e); } }
