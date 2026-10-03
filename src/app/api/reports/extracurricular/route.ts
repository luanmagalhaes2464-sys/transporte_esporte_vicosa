import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser,permissionSet } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { toCsv,toPdf,toXlsx } from "@/modules/reports/export";

export async function GET(req:NextRequest){
  try{
    const user=await currentUser();if(!user)throw new Error("UNAUTHORIZED");
    const perms=permissionSet(user);
    if(!(perms.has("extracurricular.request.review")||perms.has("admin.manage")))throw new Error("FORBIDDEN");
    const rows=(await prisma.extracurricularRequest.findMany({include:{school:true},orderBy:{departureAt:"desc"}})).map(r=>({protocolo:r.protocol,escola:r.school.name,atividade:r.activity,destino:r.destination,saida:r.departureAt.toISOString(),retorno:r.returnAt.toISOString(),alunos:r.studentCount,acompanhantes:r.companionCount,status:r.status}));
    const f=req.nextUrl.searchParams.get("format")??"csv";
    if(f==="xlsx")return new NextResponse(toXlsx(rows,"Extraclasse"),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":'attachment; filename="extraclasse.xlsx"'}});
    if(f==="pdf")return new NextResponse(await toPdf("Relatório Extraclasse",rows),{headers:{"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="extraclasse.pdf"'}});
    return new NextResponse(toCsv(rows),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="extraclasse.csv"'}});
  }catch(e){return handleRouteError(e)}
}
