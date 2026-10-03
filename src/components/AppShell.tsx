import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { getPortalSettings } from "@/config/portal";
import { currentUser, permissionSet } from "@/security/authorization";

export async function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const [s, user] = await Promise.all([getPortalSettings(), currentUser()]);
  const perms = user ? permissionSet(user) : new Set<string>();

  const adminItems = [
    { href: "/admin", label: "Visão Geral", show: ["admin.manage","school_transport.request.review","extracurricular.request.review","sports.activity.manage"].some(p => perms.has(p)) },
    { href: "/admin/transporte", label: "Transporte Escolar", show: perms.has("school_transport.request.review") },
    { href: "/admin/extraclasse", label: "Extraclasse", show: perms.has("extracurricular.request.review") },
    { href: "/admin/agenda", label: "Agenda", show: perms.has("fleet.trip.read") },
    { href: "/admin/veiculos", label: "Veículos", show: perms.has("fleet.vehicle.manage") },
    { href: "/admin/motoristas", label: "Motoristas", show: perms.has("fleet.driver.manage") },
    { href: "/admin/escolas", label: "Escolas", show: perms.has("school.manage") },
    { href: "/admin/esporte", label: "Esporte", show: perms.has("sports.activity.manage") },
    { href: "/admin/cidadaos", label: "Cidadãos", show: perms.has("citizens.read") },
    { href: "/admin/territorio", label: "Território", show: perms.has("territory.manage") },
    { href: "/admin/relatorios", label: "Relatórios", show: perms.has("reports.read") },
    { href: "/admin/auditoria", label: "Auditoria", show: perms.has("audit.read") },
    { href: "/admin/administracao", label: "Administração", show: perms.has("admin.manage") }
  ].filter(item => item.show);

  const citizenItems = [
    { href: "/cidadao", label: "Meus serviços", show: true },
    { href: "/transporte", label: "Transporte escolar", show: perms.has("school_transport.request.create") },
    { href: "/esporte", label: "Esporte e lazer", show: perms.has("sports.activity.read") || perms.has("sports.registration.create") },
    { href: "/escola", label: "Transporte extraclasse", show: perms.has("extracurricular.request.create") },
    { href: "/motorista", label: "Área do motorista", show: perms.has("fleet.trip.execute") },
    { href: "/notificacoes", label: "Notificações", show: true }
  ].filter(item => item.show);

  const items = admin ? adminItems : citizenItems;

  return <div className="app-shell">
    <header className="app-header"><div className="app-header-inner"><Link href="/"><Brand compact municipalityName={s.municipalityName} portalName={s.portalName} portalSubtitle={s.portalSubtitle}/></Link><form action="/api/auth/logout" method="post"><button className="btn-ghost" type="submit">Sair</button></form></div></header>
    <div className="app-grid"><aside className="sidebar">{items.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</aside><main className="main-content"><details className="mobile-app-menu"><summary>Menu do portal</summary><nav>{items.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav></details>{children}</main></div>
  </div>;
}
