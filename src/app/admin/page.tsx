import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { currentUser, permissionSet } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function Page(){
  const u=await currentUser(); if(!u) redirect('/entrar');
  const p=permissionSet(u); if(!['admin.manage','school_transport.request.review','extracurricular.request.review','sports.activity.manage'].some(x=>p.has(x))) redirect('/cidadao');
  const start=new Date(); start.setHours(0,0,0,0); const end=new Date(start); end.setDate(end.getDate()+1);
  const [transport,extra,trips,activities,users]=await Promise.all([
    prisma.schoolTransportRequest.count(),
    prisma.extracurricularRequest.count({where:{status:{in:['REQUESTED','UNDER_REVIEW','PENDING']}}}),
    prisma.trip.count({where:{startAt:{gte:start,lt:end},status:{not:'CANCELED'}}}),
    prisma.sportsActivity.count({where:{status:'OPEN',active:true}}),
    prisma.user.count({where:{status:'ACTIVE'}})
  ]);
  return <AppShell admin><div className="page-head"><div><h1>Visão Geral</h1><p className="muted">Operação municipal do Portal Viçosa.</p></div></div><div className="metric-grid"><div className="metric">Solicitações escolares<strong>{transport}</strong></div><div className="metric">Extraclasse aguardando<strong>{extra}</strong></div><div className="metric">Viagens hoje<strong>{trips}</strong></div><div className="metric">Atividades abertas<strong>{activities}</strong></div></div><div className="metric" style={{maxWidth:280}}>Usuários ativos<strong>{users}</strong></div></AppShell>
}
