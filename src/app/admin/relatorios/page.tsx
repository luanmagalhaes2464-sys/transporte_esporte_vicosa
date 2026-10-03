import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { currentUser, permissionSet } from "@/security/authorization";

export const dynamic = "force-dynamic";

function Group({title,base}:{title:string;base:string}) {
  return <div className="metric"><strong style={{fontSize:20,marginBottom:12}}>{title}</strong><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><a className="btn-ghost" href={`${base}?format=csv`}>CSV</a><a className="btn-ghost" href={`${base}?format=xlsx`}>XLSX</a><a className="btn-ghost" href={`${base}?format=pdf`}>PDF</a></div></div>;
}

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const perms = permissionSet(user);
  const canTransport = perms.has("school_transport.request.review") || perms.has("admin.manage");
  const canExtra = perms.has("extracurricular.request.review") || perms.has("admin.manage");
  const canSports = perms.has("sports.activity.manage") || perms.has("sports.registration.manage") || perms.has("admin.manage");
  if (!canTransport && !canExtra && !canSports) redirect("/cidadao");

  return <AppShell admin>
    <div className="page-head"><div><h1>Relatórios</h1><p className="muted">Cada diretoria visualiza apenas os relatórios da sua área.</p></div></div>
    <div className="metric-grid">
      {canTransport && <Group title="Transporte Escolar" base="/api/reports/transport"/>}
      {canExtra && <Group title="Extraclasse" base="/api/reports/extracurricular"/>}
      {canSports && <Group title="Esporte" base="/api/reports/sports"/>}
    </div>
  </AppShell>;
}
