import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission,permissionSet } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { FleetCalendar } from "@/components/FleetCalendar";
import { AgendaAssignments } from "@/components/forms/AgendaAssignments";
export const dynamic="force-dynamic";
export default async function Page(){let user;try{user=await requirePermission("fleet.trip.read")}catch{redirect("/cidadao")}const perms=permissionSet(user);const trips=await prisma.trip.findMany({include:{vehicles:{where:{active:true},include:{vehicle:true}},drivers:{where:{active:true},include:{driver:{include:{person:true}}}}},orderBy:{startAt:"asc"},take:1000});const mapped=trips.map(t=>({id:t.id,title:t.title,startAt:t.startAt.toISOString(),endAt:t.endAt.toISOString(),origin:t.origin,destination:t.destination,status:t.status,vehicle:t.vehicles[0]?.vehicle.identification,driver:t.drivers[0]?.driver.person.fullName,vehicleId:t.vehicles[0]?.vehicleId,driverId:t.drivers[0]?.driverId}));return <AppShell admin><div className="page-head"><div><h1>Agenda</h1><p className="muted">Visualize viagens por dia, semana ou mês e distribua a frota sem sobreposição.</p></div></div><FleetCalendar trips={mapped}/><AgendaAssignments trips={mapped} allowVehicle={perms.has('extracurricular.trip.assign_vehicle')} allowDriver={perms.has('extracurricular.trip.assign_driver')}/></AppShell>}
