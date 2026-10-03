import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { TransportStatusAction } from "@/components/forms/TransportStatusAction";
import { AdminPeriodForm } from "@/components/forms/AdminPeriodForm";
import { DemandMap } from "@/components/DemandMap";

export const dynamic="force-dynamic";

export default async function Page(){
  try{await requirePermission("school_transport.request.review")}catch{redirect("/cidadao")}
  const rows=await prisma.schoolTransportRequest.findMany({
    include:{student:{include:{person:true}},school:true,period:true,address:true},
    orderBy:{createdAt:"desc"},
    take:200
  });
  const counts=await prisma.schoolTransportRequest.groupBy({by:["status"],_count:{_all:true}});

  return <AppShell admin>
    <div className="page-head"><div><h1>Transporte Escolar</h1><p className="muted">Análise de solicitações e acompanhamento por status. Série e turno vêm do cadastro do aluno.</p></div></div>
    <AdminPeriodForm/>
    <div className="metric-grid">{counts.slice(0,4).map(c=><div className="metric" key={c.status}>{c.status}<strong>{c._count._all}</strong></div>)}</div>
    <section style={{marginBottom:20}}>
      <h2>Mapa da demanda</h2>
      <p className="muted">Pontos residenciais são exibidos somente nesta área autorizada. Pontos próximos são agrupados.</p>
      <DemandMap points={rows.filter(r=>r.address.latitude&&r.address.longitude).map(r=>({id:r.id,lat:Number(r.address.latitude),lng:Number(r.address.longitude),label:r.student.person.fullName,school:r.school.name}))}/>
    </section>
    <div className="table-wrap"><table><thead><tr><th>Protocolo</th><th>Aluno</th><th>Escola</th><th>Ano/série</th><th>Turno</th><th>Período</th><th>Status</th><th>Ação</th></tr></thead><tbody>
      {rows.map(r=><tr key={r.id}><td>{r.protocol}</td><td>{r.student.person.fullName}</td><td>{r.school.name}</td><td>{r.grade||"—"}</td><td>{r.shift||"—"}</td><td>{r.period.name}</td><td><span className="status">{r.status}</span></td><td><TransportStatusAction id={r.id} status={r.status}/></td></tr>)}
    </tbody></table></div>
  </AppShell>;
}
