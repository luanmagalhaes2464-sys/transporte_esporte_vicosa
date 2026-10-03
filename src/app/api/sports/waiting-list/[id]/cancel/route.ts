import { NextResponse } from "next/server";
import { currentUser } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { cancelWaitingEntry } from "@/modules/sports/service";
import { handleRouteError } from "@/lib/http";
export async function POST(_:Request,ctx:{params:Promise<{id:string}>}){try{const u=await currentUser();if(!u)throw new Error("UNAUTHORIZED");const{id}=await ctx.params;const row=await prisma.sportsWaitingList.findFirst({where:{id,userId:u.id,status:{in:["WAITING","CALLED"]}},select:{id:true}});if(!row)throw new Error("FORBIDDEN");return NextResponse.json(await cancelWaitingEntry(id,u.id))}catch(e){return handleRouteError(e)}}
