import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { AdminUserManager } from "@/components/forms/AdminUserManager";
import { AdminSettings } from "@/components/forms/AdminSettings";
export const dynamic='force-dynamic';
export default async function Page(){try{await requirePermission('admin.manage')}catch{redirect('/cidadao')}return <AppShell admin><div className="page-head"><div><h1>Administração</h1><p className="muted">Nome do portal, perfis, permissões e configurações gerais.</p></div></div><section style={{background:'white',border:'1px solid #e5e5e5',padding:20,borderRadius:8,marginBottom:24}}><h2>Configurações</h2><AdminSettings/></section><section><h2>Usuários e perfis</h2><AdminUserManager/></section></AppShell>}
