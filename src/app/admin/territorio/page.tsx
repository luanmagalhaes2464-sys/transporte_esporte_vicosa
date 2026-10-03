import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { TerritoryAdmin } from "@/components/forms/TerritoryAdmin";
export const dynamic='force-dynamic';
export default async function Page(){try{await requirePermission('territory.manage')}catch{redirect('/cidadao')}return <AppShell admin><div className="page-head"><div><h1>Território</h1><p className="muted">Bairros, ruas, localidades rurais, aliases, mapa e importação.</p></div></div><TerritoryAdmin/></AppShell>}
