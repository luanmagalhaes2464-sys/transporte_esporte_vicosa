import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { NotificationsPanel } from "@/components/forms/NotificationsPanel";
import { currentUser } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
export default async function Page(){const user=await currentUser();if(!user)redirect('/entrar');const rows=await prisma.notification.findMany({where:{userId:user.id,channel:'INTERNAL'},orderBy:{createdAt:'desc'},take:100});return <AppShell><div className="page-head"><div><h1>Notificações</h1><p className="muted">Atualizações sobre solicitações, inscrições, pendências e viagens.</p></div></div><NotificationsPanel rows={rows}/></AppShell>}
