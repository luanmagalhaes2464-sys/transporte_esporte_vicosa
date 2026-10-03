import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
export const dynamic='force-dynamic';
function Group({title,base}:{title:string;base:string}){return <div className="metric"><strong style={{fontSize:20,marginBottom:12}}>{title}</strong><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><a className="btn-ghost" href={`${base}?format=csv`}>CSV</a><a className="btn-ghost" href={`${base}?format=xlsx`}>XLSX</a><a className="btn-ghost" href={`${base}?format=pdf`}>PDF</a></div></div>}
export default async function Page(){try{await requirePermission('reports.read')}catch{redirect('/cidadao')}return <AppShell admin><div className="page-head"><div><h1>Relatórios</h1><p className="muted">Exportações respeitam as permissões do usuário autenticado.</p></div></div><div className="metric-grid"><Group title="Transporte Escolar" base="/api/reports/transport"/><Group title="Extraclasse" base="/api/reports/extracurricular"/><Group title="Esporte" base="/api/reports/sports"/></div></AppShell>}
