import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { currentUser, permissionSet } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { ExtraRequestForm } from "@/components/forms/ExtraRequestForm";
import { statusLabel } from "@/lib/labels";\nimport { ExtraCancelButton } from "@/components/forms/ExtraCancelButton";
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await currentUser(); if (!user) redirect("/entrar");
  if (!permissionSet(user).has("extracurricular.request.create")) redirect("/cidadao");
  const schoolIds = user.schoolMemberships.map(m => m.schoolId);
  const requests = await prisma.extracurricularRequest.findMany({
    where: { schoolId: { in: schoolIds } }, include: { school: true, trips: { include: { vehicles: { where: { active: true }, include: { vehicle: true } }, drivers: { where: { active: true }, include: { driver: { include: { person: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 100
  });
  return <AppShell><div className="page-head"><div><h1>Transporte Extraclasse</h1><p className="muted">Solicite transporte para atividade pedagógica, competição, evento ou visita e acompanhe o andamento.</p></div></div><div style={{ background: "white", border: "1px solid #e5e5e5", borderRadius: 8, padding: 24, marginBottom: 28 }}><ExtraRequestForm /></div><section><h2>Minhas solicitações enviadas</h2><div className="table-wrap"><table><thead><tr><th>Protocolo</th><th>Escola</th><th>Atividade</th><th>Data</th><th>Destino</th><th>Status</th><th>Veículo / motorista</th><th>Ações</th></tr></thead><tbody>{requests.map(r => <tr key={r.id}><td>{r.protocol}</td><td>{r.school.name}</td><td>{r.activity}</td><td>{r.departureAt.toLocaleString("pt-BR")}</td><td>{r.destination}</td><td><span className="status">{statusLabel(r.status)}</span></td><td>{r.trips[0]?.vehicles[0]?.vehicle.identification || "—"}{r.trips[0]?.drivers[0]?.driver.person.fullName ? ` · ${r.trips[0].drivers[0].driver.person.fullName}` : ""}</td><td><ExtraCancelButton id={r.id} departureAt={r.departureAt.toISOString()} status={r.status}/></td></tr>)}{!requests.length && <tr><td colSpan={8}>Nenhuma solicitação enviada.</td></tr>}</tbody></table></div></section></AppShell>;
}
