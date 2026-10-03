import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { currentUser, permissionSet } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { DemandMap } from "@/components/DemandMap";
import { statusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await currentUser();
  if (!u) redirect("/entrar");
  const p = permissionSet(u);
  if (!(p.has("dashboard.read") || ["admin.manage","school_transport.request.review","extracurricular.request.review","sports.activity.manage"].some(x => p.has(x)))) redirect("/cidadao");

  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(end.getDate()+1);

  const [transportRows, extraPending, tripsToday, openActivities, confirmedSports, waitingSports, activeUsers, sportRows] = await Promise.all([
    prisma.schoolTransportRequest.findMany({
      include: {
        school: true,
        address: { include: { neighborhood: true, ruralLocality: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 500
    }),
    prisma.extracurricularRequest.count({ where: { status: { in: ["REQUESTED","UNDER_REVIEW","PENDING"] } } }),
    prisma.trip.count({ where: { startAt: { gte: start, lt: end }, status: { not: "CANCELED" } } }),
    prisma.sportsActivity.count({ where: { status: "OPEN", active: true } }),
    prisma.sportsRegistration.count({ where: { status: "CONFIRMED" } }),
    prisma.sportsWaitingList.count({ where: { status: { in: ["WAITING","CALLED"] } } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.sportsActivity.findMany({
      where: { active: true },
      include: {
        category: true,
        _count: {
          select: {
            registrations: { where: { status: "CONFIRMED" } },
            waitingList: { where: { status: { in: ["WAITING","CALLED"] } } }
          }
        }
      },
      orderBy: { registrationEnd: "asc" },
      take: 8
    })
  ]);

  const points = transportRows
    .filter(r => r.address.latitude && r.address.longitude)
    .map(r => ({
      id: r.id,
      lat: Number(r.address.latitude),
      lng: Number(r.address.longitude),
      label: "Solicitação de transporte escolar",
      school: r.school.name
    }));

  const localityCounts = new Map<string, number>();
  for (const r of transportRows) {
    const place = r.address.neighborhood?.name || r.address.ruralLocality?.name || "Localidade não identificada";
    localityCounts.set(place, (localityCounts.get(place) || 0) + 1);
  }
  const localities = [...localityCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0,12);

  return <AppShell admin>
    <div className="page-head"><div><h1>Visão Geral da Secretaria</h1><p className="muted">Painel de acompanhamento. Os indicadores e o mapa são somente leitura.</p></div></div>

    <div className="metric-grid">
      <div className="metric">Solicitações de transporte escolar<strong>{transportRows.length}</strong></div>
      <div className="metric">Extraclasse aguardando<strong>{extraPending}</strong></div>
      <div className="metric">Viagens hoje<strong>{tripsToday}</strong></div>
      <div className="metric">Atividades esportivas abertas<strong>{openActivities}</strong></div>
      <div className="metric">Inscrições esportivas confirmadas<strong>{confirmedSports}</strong></div>
      <div className="metric">Lista de espera do esporte<strong>{waitingSports}</strong></div>
    </div>

    <section style={{ marginTop: 28, marginBottom: 28 }}>
      <h2>Mapa das solicitações de transporte escolar</h2>
      <p className="muted">Mostra a distribuição geográfica da demanda. O painel de leitura não exibe o nome do aluno no mapa.</p>
      <DemandMap points={points}/>
    </section>

    <section style={{ marginBottom: 28 }}>
      <h2>Solicitações por bairro/localidade</h2>
      <div className="table-wrap"><table><thead><tr><th>Bairro / localidade</th><th>Solicitações</th></tr></thead><tbody>
        {localities.map(([name,count]) => <tr key={name}><td>{name}</td><td>{count}</td></tr>)}
        {!localities.length && <tr><td colSpan={2}>Ainda não há solicitações com endereço cadastrado.</td></tr>}
      </tbody></table></div>
    </section>

    <section style={{ marginBottom: 28 }}>
      <h2>Esporte e lazer</h2>
      <p className="muted">Resumo das atividades e procura registrada no portal.</p>
      <div className="table-wrap"><table><thead><tr><th>Atividade</th><th>Modalidade</th><th>Vagas</th><th>Inscritos</th><th>Espera</th><th>Status</th></tr></thead><tbody>
        {sportRows.map(a => <tr key={a.id}><td>{a.name}</td><td>{a.category.name}</td><td>{a.capacity}</td><td>{a._count.registrations}</td><td>{a._count.waitingList}</td><td><span className="status">{statusLabel(a.status)}</span></td></tr>)}
        {!sportRows.length && <tr><td colSpan={6}>Nenhuma atividade esportiva cadastrada.</td></tr>}
      </tbody></table></div>
    </section>

    <div className="metric" style={{ maxWidth: 280 }}>Usuários ativos no portal<strong>{activeUsers}</strong></div>
  </AppShell>;
}
