import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { currentUser } from "@/security/authorization";
import { ownsTransportRequest } from "@/security/ownership";
import { prisma } from "@/lib/prisma";
import { DocumentUploader } from "@/components/forms/DocumentUploader";
import { SubmitTransportRequestButton } from "@/components/forms/SubmitTransportRequestButton";
import { statusLabel } from "@/lib/labels";
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) redirect("/entrar"); const { id } = await params;
  if (!(await ownsTransportRequest(user, id))) notFound();
  const request = await prisma.schoolTransportRequest.findUnique({ where: { id }, include: { student: { include: { person: true } }, school: true, address: { include: { street: true, neighborhood: true, ruralLocality: true } }, period: { include: { documentRequirements: { where: { active: true }, orderBy: { createdAt: "asc" } } } }, documents: true, history: { orderBy: { createdAt: "asc" } } } });
  if (!request) notFound();
  const byRequirement = new Map(request.documents.filter(d => d.transportRequirementId).map(d => [d.transportRequirementId!, d]));
  return <AppShell><div className="page-head"><div><h1>{request.protocol}</h1><p className="muted">{request.period.name} · {request.student.person.fullName}</p></div><span className="status">{statusLabel(request.status)}</span></div>
    <div className="metric-grid"><div className="metric">Escola<strong style={{fontSize:18}}>{request.school.name}</strong></div><div className="metric">Situação<strong style={{fontSize:18}}>{statusLabel(request.status)}</strong></div></div>
    {request.status === "DRAFT" && request.period.documentRequirements.length > 0 && <section style={{ marginBottom: 28 }}><h2>Documentos</h2><p className="muted">Anexe os documentos obrigatórios. PDF, JPG ou PNG, até 10 MB por arquivo.</p><div style={{ display: "grid", gap: 12 }}>{request.period.documentRequirements.map(r => <DocumentUploader key={r.id} requestId={request.id} requirementId={r.id} requirementName={`${r.name}${r.required ? " *" : ""}`} currentFilename={byRequirement.get(r.id)?.originalFilename} />)}</div><div style={{ marginTop: 18 }}><SubmitTransportRequestButton requestId={request.id} /></div></section>}
    <section><h2>Histórico</h2><div style={{ display: "grid", gap: 10 }}>{request.history.map(h => <div key={h.id} style={{ borderLeft: "3px solid #B51F2A", padding: "8px 12px" }}><strong>{statusLabel(h.toStatus)}</strong><div className="muted">{h.createdAt.toLocaleString("pt-BR")}{h.note ? ` · ${h.note}` : ""}</div></div>)}</div></section>
  </AppShell>;
}
