import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { getPortalSettings } from "@/config/portal";
export async function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const s=await getPortalSettings();
  const items = admin ? [["/admin","Visão Geral"],["/admin/transporte","Transporte Escolar"],["/admin/extraclasse","Extraclasse"],["/admin/agenda","Agenda"],["/admin/veiculos","Veículos"],["/admin/motoristas","Motoristas"],["/admin/escolas","Escolas"],["/admin/esporte","Esporte"],["/admin/cidadaos","Cidadãos"],["/admin/territorio","Território"],["/admin/relatorios","Relatórios"],["/admin/auditoria","Auditoria"],["/admin/administracao","Administração"]] : [["/cidadao","Meus serviços"],["/transporte","Transporte escolar"],["/esporte","Esporte e lazer"],["/notificacoes","Notificações"]];
  return <div className="app-shell"><header className="app-header"><div className="container-pv" style={{display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:68,gap:12}}><Link href="/"><Brand compact municipalityName={s.municipalityName} portalName={s.portalName} portalSubtitle={s.portalSubtitle}/></Link><form action="/api/auth/logout" method="post"><button className="btn-ghost" type="submit">Sair</button></form></div></header><div className="app-grid"><aside className="sidebar">{items.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</aside><main className="main-content"><details className="mobile-app-menu"><summary>Menu do portal</summary><nav>{items.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</nav></details>{children}</main></div></div>;
}
