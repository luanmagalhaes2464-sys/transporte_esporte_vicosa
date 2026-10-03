import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { AdminFleetForms } from "@/components/forms/AdminFleetForms";

import { statusLabel } from "@/lib/labels";
export const dynamic = "force-dynamic";

export default async function Page() {
  try { await requirePermission("fleet.trip.read"); }
  catch { redirect("/cidadao"); }

  const [trips, vehicles, drivers] = await Promise.all([
    prisma.trip.findMany({
      include: {
        vehicles: { where: { active: true }, include: { vehicle: true } },
        drivers: { where: { active: true }, include: { driver: { include: { person: true } } } }
      },
      orderBy: { startAt: "asc" }, take: 200
    }),
    prisma.vehicle.findMany({ where: { active: true }, orderBy: { identification: "asc" } }),
    prisma.driver.findMany({ where: { active: true }, include: { person: true }, orderBy: { cnhExpiry: "asc" } })
  ]);

  const expiring = drivers.filter(d => d.cnhExpiry.getTime() >= Date.now() && d.cnhExpiry.getTime() - Date.now() < 30 * 86400000).length;

  return <AppShell admin>
    <div className="page-head"><div><h1>Agenda e Frota</h1><p className="muted">Viagens, veículos, motoristas e alertas de CNH.</p></div></div>
    <AdminFleetForms/>
    <div className="metric-grid"><div className="metric">Veículos<strong>{vehicles.length}</strong></div><div className="metric">Motoristas<strong>{drivers.length}</strong></div><div className="metric">Viagens carregadas<strong>{trips.length}</strong></div><div className="metric">CNH em 30 dias<strong>{expiring}</strong></div></div>
    <div className="table-wrap"><table><thead><tr><th>Horário</th><th>Origem</th><th>Destino</th><th>Veículo</th><th>Motorista</th><th>Status</th></tr></thead><tbody>{trips.map(t=><tr key={t.id}><td>{t.startAt.toLocaleString("pt-BR")}</td><td>{t.origin}</td><td>{t.destination}</td><td>{t.vehicles[0]?.vehicle.identification||"—"}</td><td>{t.drivers[0]?.driver.person.fullName||"—"}</td><td>{statusLabel(t.status)}</td></tr>)}</tbody></table></div>
  </AppShell>;
}
