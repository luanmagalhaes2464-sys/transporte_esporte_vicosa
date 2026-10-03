import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { AdminSportsForms } from "@/components/forms/AdminSportsForms";
import { CallNextWaitingButton } from "@/components/forms/CallNextWaitingButton";
import { SportsActivityStructure } from "@/components/forms/SportsActivityStructure";
import { SportsActivityEditForm } from "@/components/forms/SportsActivityEditForm";
import { statusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function Page({searchParams}:{searchParams:Promise<{q?:string;status?:string}>}) {
  try { await requirePermission("sports.activity.manage"); }
  catch { redirect("/cidadao"); }

  const params=await searchParams;
  const q=(params.q||"").trim().toLocaleLowerCase("pt-BR");
  const status=params.status||"";

  const rows = await prisma.sportsActivity.findMany({
    include: {
      category: true,
      schedules: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
      boardingPoints: { where: { active: true }, orderBy: { name: "asc" } },
      trips: { where: { status: { not: "CANCELED" } }, orderBy: { startAt: "desc" }, take: 1 },
      registrations: { include: { participant: true, boardingPoint: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { registrations: { where: { status: "CONFIRMED" } }, waitingList: { where: { status: { in: ["WAITING","CALLED"] } } } } }
    },
    orderBy: { registrationStart: "desc" }
  });

  const visibleRows=rows.filter(a=>{
    const matchesStatus=!status||a.status===status;
    const hay=`${a.name} ${a.category.name} ${a.locationName} ${a.audience||""}`.toLocaleLowerCase("pt-BR");
    return matchesStatus&&(!q||hay.includes(q));
  });

  const registrations=rows.flatMap(activity=>activity.registrations.map(registration=>({activity,registration})))
    .filter(({activity,registration})=>{
      if(!q)return true;
      return `${registration.protocol} ${registration.participant.fullName} ${registration.participant.phone||""} ${activity.name}`.toLocaleLowerCase("pt-BR").includes(q);
    })
    .sort((a,b)=>b.registration.createdAt.getTime()-a.registration.createdAt.getTime());

  return <AppShell admin>
    <div className="page-head"><div><h1>Diretoria de Esporte</h1><p className="muted">Cadastre modalidades e atividades, disponibilize inscrições e acompanhe os participantes.</p></div></div>

    <form method="get" className="panel" style={{display:"grid",gridTemplateColumns:"minmax(240px,1fr) 220px auto",gap:12,alignItems:"end",marginBottom:18}}>
      <div className="field"><label>Filtrar</label><input name="q" defaultValue={params.q||""} placeholder="Atividade, modalidade, participante ou protocolo"/></div>
      <div className="field"><label>Status da atividade</label><select name="status" defaultValue={status}><option value="">Todos</option><option value="OPEN">Aberto</option><option value="DRAFT">Rascunho</option><option value="SCHEDULED">Agendado</option><option value="CLOSED">Encerrado</option><option value="CANCELED">Cancelado</option><option value="COMPLETED">Concluído</option></select></div>
      <button className="btn-primary" type="submit">Filtrar</button>
    </form>

    <AdminSportsForms/>

    <h2>Atividades cadastradas</h2>
    <div className="table-wrap"><table><thead><tr><th>Atividade</th><th>Modalidade</th><th>Vagas</th><th>Inscritos</th><th>Espera</th><th>Status</th><th>Editar</th><th>Configuração</th><th>Lista de espera</th></tr></thead><tbody>
      {visibleRows.map(a => <tr key={a.id}>
        <td>{a.name}</td><td>{a.category.name}</td><td>{a.capacity}</td><td>{a._count.registrations}</td><td>{a._count.waitingList}</td><td>{statusLabel(a.status)}</td>
        <td><SportsActivityEditForm activity={{id:a.id,name:a.name,description:a.description,audience:a.audience,minAge:a.minAge,maxAge:a.maxAge,locationName:a.locationName,capacity:a.capacity,registrationStart:a.registrationStart.toISOString(),registrationEnd:a.registrationEnd.toISOString(),activityStart:a.activityStart.toISOString(),activityEnd:a.activityEnd?.toISOString()||null,responsibleName:a.responsibleName,contact:a.contact,status:a.status}}/></td>
        <td><SportsActivityStructure activityId={a.id} offersTransport={a.offersTransport} schedules={a.schedules} boardingPoints={a.boardingPoints} trip={a.trips[0]?{id:a.trips[0].id,startAt:a.trips[0].startAt.toISOString(),endAt:a.trips[0].endAt.toISOString()}:null}/></td>
        <td>{a._count.waitingList>0?<CallNextWaitingButton activityId={a.id}/>:"—"}</td>
      </tr>)}
      {!visibleRows.length && <tr><td colSpan={9}>Nenhuma atividade encontrada com os filtros informados.</td></tr>}
    </tbody></table></div>

    <section style={{ marginTop: 32 }}>
      <h2>Inscrições recebidas</h2>
      <p className="muted">Pessoas inscritas nas atividades esportivas do Município.</p>
      <div className="table-wrap"><table><thead><tr><th>Protocolo</th><th>Participante</th><th>Atividade</th><th>Telefone</th><th>Transporte</th><th>Ponto de embarque</th><th>Status</th><th>Inscrição</th></tr></thead><tbody>
        {registrations.map(({activity,registration}) => <tr key={registration.id}>
          <td>{registration.protocol}</td><td>{registration.participant.fullName}</td><td>{activity.name}</td><td>{registration.participant.phone || "—"}</td><td>{registration.wantsTransport ? "Sim" : "Não"}</td><td>{registration.boardingPoint?.name || "—"}</td><td>{statusLabel(registration.status)}</td><td>{registration.createdAt.toLocaleDateString("pt-BR")}</td>
        </tr>)}
        {!registrations.length && <tr><td colSpan={8}>Nenhuma inscrição encontrada.</td></tr>}
      </tbody></table></div>
    </section>
  </AppShell>;
}
