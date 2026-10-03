import { NextResponse } from "next/server";
import { currentUser } from "@/security/authorization";
import { ownsSportsRegistration } from "@/security/ownership";
import { cancelSportsRegistration } from "@/modules/sports/service";
import { handleRouteError } from "@/lib/http";
export async function POST(_:Request,ctx:{params:Promise<{id:string}>}){try{const u=await currentUser();if(!u)throw new Error("UNAUTHORIZED");const{id}=await ctx.params;if(!(await ownsSportsRegistration(u,id)))throw new Error("FORBIDDEN");return NextResponse.json(await cancelSportsRegistration(id,u.id))}catch(e){return handleRouteError(e)}}
