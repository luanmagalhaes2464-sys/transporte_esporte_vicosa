import { NextResponse } from "next/server";
import { requirePermission } from "@/security/authorization";
import { callNextWaiting } from "@/modules/sports/service";
import { handleRouteError } from "@/lib/http";
export async function POST(_:Request,ctx:{params:Promise<{id:string}>}){try{const u=await requirePermission("sports.registration.manage");const{id}=await ctx.params;return NextResponse.json(await callNextWaiting(id,u.id))}catch(e){return handleRouteError(e)}}
