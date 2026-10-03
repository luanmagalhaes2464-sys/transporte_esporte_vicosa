import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { ExtraStatusAction } from "@/components/forms/ExtraStatusAction";
import { TripSetup } from "@/components/forms/TripSetup";
import { statusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function Page() {
  try { await requirePermission("extracurricular.request.review"); }
  catch { redirect("/cidadao"); }

  const rows = await prisma.extracurricularRequest.findMany({
    include: {
      school: true,
      trips: {
        include: {
          vehicles: { where: { active: true }, include: { vehicle: true } },
          drivers: { where: { active: true }, include: { driver: { include: { person: true } } } }
        }
      }
    },
    orderBy: { departureAt: "asc" }
  });

  const pending = rows.filter(r => ["REQUESTED","UNDER_REVIEW","PENDING","APPROVED","VEHICLE_DEFINED"].includes(r.status));
  const awaitingDriver = rows.filter(r => r.status === "DRIVER_DEFINED");
  const confirmed = rows.filter(r => r.status === "DRIVER_CONFIRMED");
  const completed = rows.filter(r => r.status === "COMPLETED");

  function table(items: typeof rows) {
    return <div className="table-wrap"><table><thead><tr>
      <th>Protocolo</th><th>Escola</th><th>Atividade</th><th>Data / turno</th><th>Destino</th><th>Passageiros</th><th>Status</th><th>Ações</th>
    </tr></thead><tbody>
      {items.map(r => <tr key={r.id}>
        <td>{r.protocol}</td>
        <td>{r.school.name}</td>
        <td>{r.activity}</td>
        <td>{r.departureAt.toLocaleString("pt-BR")} {r.shift ? `· ${r.shift === "MORNING" ? "Manhã" : "Tarde"}` : ""}</td>
        <td>{r.destination}</td>
        <td>{r.studentCount + r.companionCount}</td>
        <td><span className="status">{statusLabel(r.status)}</span></td>
        <td><ExtraStatusAction id={r.id} status={r.status}/><TripSetup request={{id:r.id,activity:r.activity,departureAt:r.departureAt.toISOString(),returnAt:r.returnAt.toISOString(),origin:r.origin,destination:r.destination,studentCount:r.studentCount,companionCount:r.companionCount,status:r.status}} trip={r.trips[0]?{id:r.trips[0].id}:null}/></td>
      </tr>)}
      {!items.length && <tr><td colSpan={8}>Nenhum registro nesta etapa.</td></tr>}
    </tbody></table></div>;
  }

  return <AppShell admin>
    <div className="page-head"><div><h1>Transporte Escolar Extraclasse</h1><p className="muted">Fluxo da Secretaria: análise, definição de veículo e motorista e acompanhamento dos agendamentos.</p></div></div>

    <div className="kpi-grid" style={{marginBottom:24}}>
      <div className="kpi"><span>Solicitações pendentes das escolas</span><strong>{pending.length}</strong></div>
      <div className="kpi"><span>Enviadas aos motoristas</span><strong>{awaitingDriver.length}</strong><small>Aguardando aceite</small></div>
      <div className="kpi"><span>Agendamentos confirmados</span><strong>{confirmed.length}</strong></div>
      <div className="kpi"><span>Realizados</span><strong>{completed.length}</strong></div>
    </div>

    <section><h2>Solicitações pendentes das escolas</h2>{table(pending)}</section>
    <section style={{marginTop:28}}><h2>Enviadas aos motoristas — aguardando aceite</h2>{table(awaitingDriver)}</section>
    <section style={{marginTop:28}}><h2>Agendamentos confirmados</h2>{table(confirmed)}</section>
    <section style={{marginTop:28}}><h2>Realizados</h2>{table(completed)}</section>
  </AppShell>;
}
