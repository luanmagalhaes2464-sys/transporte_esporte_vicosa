import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { maskCpf } from "@/lib/normalize";
export const dynamic='force-dynamic';
export default async function Page(){try{await requirePermission('citizens.read')}catch{redirect('/cidadao')}const rows=await prisma.person.findMany({include:{user:true,student:{include:{school:true}},guardian:true},orderBy:{fullName:'asc'},take:500});return <AppShell admin><div className="page-head"><div><h1>Cidadãos</h1><p className="muted">Consulta administrativa. CPF aparece mascarado nesta listagem.</p></div></div><div className="table-wrap"><table><thead><tr><th>Nome</th><th>CPF</th><th>Tipo</th><th>Escola</th><th>Conta</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.fullName}</td><td>{r.cpf?maskCpf(r.cpf):'—'}</td><td>{r.student?'Aluno':r.guardian?'Responsável':'Cidadão'}</td><td>{r.student?.school?.name||'—'}</td><td>{r.user?'Ativa':'Sem login'}</td></tr>)}</tbody></table></div></AppShell>}
