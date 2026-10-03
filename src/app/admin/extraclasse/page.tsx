import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { ExtraStatusAction } from "@/components/forms/ExtraStatusAction";
import { TripSetup } from "@/components/forms/TripSetup";

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

  return <AppShell admin>
    <div className="page-head"><div><h1>Transporte Extraclasse</h1><p className="muted">Solicitações das escolas, definição de viagens, veículos e motoristas.</p></div></div>
    <div className="table-wrap"><table><thead><tr><th>Protocolo</th><th>Escola</th><th>Atividade</th><th>Saída</th><th>Destino</th><th>Status</th><th>Ações</th></tr></thead><tbody>
      {rows.map(r => <tr key={r.id}><td>{r.protocol}</td><td>{r.school.name}</td><td>{r.activity}</td><td>{r.departureAt.toLocaleString("pt-BR")}</td><td>{r.destination}</td><td><span className="status">{r.status}</span></td><td><ExtraStatusAction id={r.id} status={r.status}/><TripSetup request={{id:r.id,activity:r.activity,departureAt:r.departureAt.toISOString(),returnAt:r.returnAt.toISOString(),origin:r.origin,destination:r.destination,studentCount:r.studentCount,companionCount:r.companionCount,status:r.status}} trip={r.trips[0]?{id:r.trips[0].id}:null}/></td></tr>)}
    </tbody></table></div>
  </AppShell>;
}
