import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { AdminSportsForms } from "@/components/forms/AdminSportsForms";
import { CallNextWaitingButton } from "@/components/forms/CallNextWaitingButton";
import { SportsActivityStructure } from "@/components/forms/SportsActivityStructure";
import { statusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function Page() {
  try { await requirePermission("sports.activity.manage"); }
  catch { redirect("/cidadao"); }

  const rows = await prisma.sportsActivity.findMany({
    include: {
      category: true,
      schedules: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
      boardingPoints: { where: { active: true }, orderBy: { name: "asc" } },
      trips: { where: { status: { not: "CANCELED" } }, orderBy: { startAt: "desc" }, take: 1 },
      registrations: {
        include: { participant: true, boardingPoint: true },
        orderBy: { createdAt: "desc" }
      },
      _count: {
        select: {
          registrations: { where: { status: "CONFIRMED" } },
          waitingList: { where: { status: { in: ["WAITING","CALLED"] } } }
        }
      }
    },
    orderBy: { registrationStart: "desc" }
  });

  const registrations = rows.flatMap(activity =>
    activity.registrations.map(registration => ({ activity, registration }))
  ).sort((a,b) => b.registration.createdAt.getTime() - a.registration.createdAt.getTime());

  return <AppShell admin>
    <div className="page-head"><div><h1>Diretoria de Esporte</h1><p className="muted">Cadastre modalidades e atividades, disponibilize inscrições e acompanhe os participantes.</p></div></div>
    <AdminSportsForms/>

    <h2>Atividades cadastradas</h2>
    <div className="table-wrap"><table><thead><tr><th>Atividade</th><th>Modalidade</th><th>Vagas</th><th>Inscritos</th><th>Espera</th><th>Status</th><th>Configuração</th><th>Lista de espera</th></tr></thead><tbody>
      {rows.map(a => <tr key={a.id}>
        <td>{a.name}</td><td>{a.category.name}</td><td>{a.capacity}</td><td>{a._count.registrations}</td><td>{a._count.waitingList}</td><td>{statusLabel(a.status)}</td>
        <td><SportsActivityStructure activityId={a.id} offersTransport={a.offersTransport} schedules={a.schedules} boardingPoints={a.boardingPoints} trip={a.trips[0]?{id:a.trips[0].id,startAt:a.trips[0].startAt.toISOString(),endAt:a.trips[0].endAt.toISOString()}:null}/></td>
        <td>{a._count.waitingList>0?<CallNextWaitingButton activityId={a.id}/>:"—"}</td>
      </tr>)}
      {!rows.length && <tr><td colSpan={8}>Nenhuma atividade cadastrada.</td></tr>}
    </tbody></table></div>

    <section style={{ marginTop: 32 }}>
      <h2>Inscrições recebidas</h2>
      <p className="muted">Pessoas inscritas nas atividades esportivas do Município.</p>
      <div className="table-wrap"><table><thead><tr><th>Protocolo</th><th>Participante</th><th>Atividade</th><th>Telefone</th><th>Transporte</th><th>Ponto de embarque</th><th>Status</th><th>Inscrição</th></tr></thead><tbody>
        {registrations.map(({activity,registration}) => <tr key={registration.id}>
          <td>{registration.protocol}</td>
          <td>{registration.participant.fullName}</td>
          <td>{activity.name}</td>
          <td>{registration.participant.phone || "—"}</td>
          <td>{registration.wantsTransport ? "Sim" : "Não"}</td>
          <td>{registration.boardingPoint?.name || "—"}</td>
          <td>{statusLabel(registration.status)}</td>
          <td>{registration.createdAt.toLocaleDateString("pt-BR")}</td>
        </tr>)}
        {!registrations.length && <tr><td colSpan={8}>Nenhuma inscrição recebida até o momento.</td></tr>}
      </tbody></table></div>
    </section>
  </AppShell>;
}
