import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { SchoolManager } from "@/components/forms/SchoolManager";
export const dynamic='force-dynamic';
export default async function Page(){try{await requirePermission('school.manage')}catch{redirect('/cidadao')}return <AppShell admin><div className="page-head"><div><h1>Escolas</h1><p className="muted">Cadastro de unidades escolares e dados operacionais.</p></div></div><SchoolManager/></AppShell>}
