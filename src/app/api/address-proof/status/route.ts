import { NextResponse } from "next/server";
import { requireUser } from "@/security/authorization";
import { documentAiEnabled } from "@/providers/document-ai";
import { handleRouteError } from "@/lib/http";

export async function GET(){
  try{
    await requireUser();
    return NextResponse.json({enabled:documentAiEnabled()});
  }catch(e){return handleRouteError(e)}
}
