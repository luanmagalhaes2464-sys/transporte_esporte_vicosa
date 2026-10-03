import { redirect } from "next/navigation";
import {
  SchoolTransportRequestStatus,
  SportsActivityStatus
} from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { currentUser, permissionSet } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { DemandMap } from "@/components/DemandMap";
import { statusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

const transportStatuses = Object.values(SchoolTransportRequestStatus);
const sportStatuses = Object.values(SportsActivityStatus);

function dateRange(from?:string,to?:string){
  const createdAt:{gte?:Date;lte?:Date}={};
  if(from) createdAt.gte=new Date(`${from}T00:00:00-03:00`);
  if(to) createdAt.lte=new Date(`${to}T23:59:59.999-03:00`);
  return Object.keys(createdAt).length?createdAt:undefined;
}

export default async function Page({searchParams}:{searchParams:Promise<{from?:string;to?:string;transportStatus?:string;sportStatus?:string;schoolId?:string;categoryId?:string}>}) {
  const u = await currentUser();
  if (!u) redirect("/entrar");
  const p = permissionSet(u);
  if (!(p.has("dashboard.read") || p.has("admin.manage"))) redirect("/cidadao");

  const roles=new Set(u.roles.map(r=>r.role.code));
  const isSecretary=roles.has("SECRETARIA_VIEWER")||roles.has("SECRETARIA")||roles.has("ADMIN");
  const canTransport=isSecretary||roles.has("TRANSPORT_DIRECTOR")||roles.has("TRANSPORT")||roles.has("EDUCATION");
  const canSports=isSecretary||roles.has("SPORTS_DIRECTOR")||roles.has("SPORTS");

  const params=await searchParams;
  const createdAt=dateRange(params.from,params.to);
  const transportStatus=transportStatuses.includes(params.transportStatus as SchoolTransportRequestStatus)?params.transportStatus as SchoolTransportRequestStatus:undefined;
  const sportStatus=sportStatuses.includes(params.sportStatus as SportsActivityStatus)?params.sportStatus as SportsActivityStatus:undefined;
  const schoolId=params.schoolId||undefined;
  const categoryId=params.categoryId||undefined;

  const [schools,categories]=await Promise.all([
    canTransport?prisma.school.findMany({where:{active:true},select:{id:true,name:true},orderBy:{name:"asc"}}):Promise.resolve([]),
    canSports?prisma.sportsCategory.findMany({where:{active:true},select:{id:true,name:true},orderBy:{name:"asc"}}):Promise.resolve([])
  ]);

  const startToday=new Date();startToday.setHours(0,0,0,0);
  const endToday=new Date(startToday);endToday.setDate(endToday.getDate()+1);

  let transportRows:any[]=[];
  let transportTotal=0,transportPending=0,transportApproved=0,transportActive=0,extraPending=0,tripsToday=0;
  if(canTransport){
    const baseWhere:any={};
    if(createdAt)baseWhere.createdAt=createdAt;
    if(schoolId)baseWhere.schoolId=schoolId;
    const visibleWhere:any={...baseWhere};
    if(transportStatus)visibleWhere.status=transportStatus;

    [transportRows,transportTotal,transportPending,transportApproved,transportActive,extraPending,tripsToday]=await Promise.all([
      prisma.schoolTransportRequest.findMany({
        where:visibleWhere,
        include:{school:true,address:{include:{neighborhood:true,ruralLocality:true}}},
        orderBy:{createdAt:"desc"},
        take:500
      }),
      prisma.schoolTransportRequest.count({where:visibleWhere}),
      prisma.schoolTransportRequest.count({where:{...baseWhere,status:{in:["SUBMITTED","UNDER_REVIEW","PENDING"]}}}),
      prisma.schoolTransportRequest.count({where:{...baseWhere,status:"APPROVED"}}),
      prisma.schoolTransportRequest.count({where:{...baseWhere,status:{in:["ROUTE_DEFINED","ACTIVE"]}}}),
      prisma.extracurricularRequest.count({where:{...(createdAt?{createdAt}:{}),status:{in:["REQUESTED","UNDER_REVIEW","PENDING"]}}}),
      prisma.trip.count({where:{startAt:{gte:startToday,lt:endToday},status:{not:"CANCELED"}}})
    ]);
  }

  let sportRows:any[]=[];
  let openActivities=0,confirmedSports=0,waitingSports=0,totalActivities=0;
  if(canSports){
    const activityWhere:any={active:true};
    if(categoryId)activityWhere.categoryId=categoryId;
    if(sportStatus)activityWhere.status=sportStatus;

    const activityScope:any={};
    if(categoryId)activityScope.categoryId=categoryId;
    if(sportStatus)activityScope.status=sportStatus;

    [sportRows,openActivities,confirmedSports,waitingSports,totalActivities]=await Promise.all([
      prisma.sportsActivity.findMany({
        where:activityWhere,
        include:{
          category:true,
          _count:{
            select:{
              registrations:{where:{status:"CONFIRMED",...(createdAt?{createdAt}: {})}},
              waitingList:{where:{status:{in:["WAITING","CALLED"]},...(createdAt?{createdAt}: {})}}
            }
          }
        },
        orderBy:{registrationEnd:"asc"},
        take:50
      }),
      prisma.sportsActivity.count({where:{active:true,status:"OPEN",...(categoryId?{categoryId}: {})}}),
      prisma.sportsRegistration.count({
        where:{
          status:"CONFIRMED",
          ...(createdAt?{createdAt}:{}),
          ...(Object.keys(activityScope).length?{activity:activityScope}:{})
        }
      }),
      prisma.sportsWaitingList.count({
        where:{
          status:{in:["WAITING","CALLED"]},
          ...(createdAt?{createdAt}:{}),
          ...(Object.keys(activityScope).length?{activity:activityScope}:{})
        }
      }),
      prisma.sportsActivity.count({where:activityWhere})
    ]);
  }

  const points=transportRows
    .filter(r=>r.address.latitude&&r.address.longitude)
    .map(r=>({id:r.id,lat:Number(r.address.latitude),lng:Number(r.address.longitude),label:"Solicitação de transporte escolar",school:r.school.name}));

  const localityCounts=new Map<string,number>();
  for(const r of transportRows){
    const place=r.address.neighborhood?.name||r.address.ruralLocality?.name||"Localidade não identificada";
    localityCounts.set(place,(localityCounts.get(place)||0)+1);
  }
  const localities=[...localityCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15);

  const activeUsers=isSecretary?await prisma.user.count({where:{status:"ACTIVE"}}):0;
  const title=isSecretary?"Visão Geral da Secretaria":canTransport&&!canSports?"Visão Geral — Diretoria de Transporte":canSports&&!canTransport?"Visão Geral — Diretoria de Esporte":"Visão Geral";

  return <AppShell admin>
    <div className="page-head">
      <div><h1>{title}</h1><p className="muted">Use os filtros para analisar os dados disponíveis para o seu perfil.</p></div>
    </div>

    <form method="get" className="dashboard-filters">
      <div className="field"><label>De</label><input name="from" type="date" defaultValue={params.from||""}/></div>
      <div className="field"><label>Até</label><input name="to" type="date" defaultValue={params.to||""}/></div>

      {canTransport&&<>
        <div className="field"><label>Status do transporte escolar</label><select name="transportStatus" defaultValue={transportStatus||""}><option value="">Todos</option>{transportStatuses.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></div>
        <div className="field"><label>Escola</label><select name="schoolId" defaultValue={schoolId||""}><option value="">Todas</option>{schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      </>}

      {canSports&&<>
        <div className="field"><label>Status da atividade</label><select name="sportStatus" defaultValue={sportStatus||""}><option value="">Todos</option>{sportStatuses.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></div>
        <div className="field"><label>Modalidade</label><select name="categoryId" defaultValue={categoryId||""}><option value="">Todas</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </>}

      <div className="dashboard-filter-actions"><button className="btn-primary" type="submit">Aplicar filtros</button><a className="btn-ghost" href="/admin">Limpar</a></div>
    </form>

    {canTransport&&<>
      <section className="dashboard-section">
        <div className="dashboard-section-head"><div><h2>Transporte</h2><p className="muted">Demanda de transporte escolar e operação do transporte municipal.</p></div></div>
        <div className="metric-grid">
          <div className="metric">Solicitações filtradas<strong>{transportTotal}</strong></div>
          <div className="metric">Aguardando análise<strong>{transportPending}</strong></div>
          <div className="metric">Aprovadas<strong>{transportApproved}</strong></div>
          <div className="metric">Com rota / ativas<strong>{transportActive}</strong></div>
          <div className="metric">Extraclasse aguardando<strong>{extraPending}</strong></div>
          <div className="metric">Viagens hoje<strong>{tripsToday}</strong></div>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Mapa da demanda de transporte escolar</h2>
        <p className="muted">A distribuição geográfica respeita os filtros acima. Nomes de alunos não são exibidos no mapa.</p>
        <DemandMap points={points}/>
      </section>

      <section className="dashboard-section">
        <h2>Solicitações por bairro/localidade</h2>
        <div className="table-wrap"><table><thead><tr><th>Bairro / localidade</th><th>Solicitações</th></tr></thead><tbody>
          {localities.map(([name,count])=><tr key={name}><td>{name}</td><td>{count}</td></tr>)}
          {!localities.length&&<tr><td colSpan={2}>Nenhuma solicitação encontrada com os filtros selecionados.</td></tr>}
        </tbody></table></div>
      </section>
    </>}

    {canSports&&<section className="dashboard-section">
      <div className="dashboard-section-head"><div><h2>Esporte e lazer</h2><p className="muted">Oferta de atividades, inscrições confirmadas e procura em lista de espera.</p></div></div>
      <div className="metric-grid">
        <div className="metric">Atividades no filtro<strong>{totalActivities}</strong></div>
        <div className="metric">Atividades abertas<strong>{openActivities}</strong></div>
        <div className="metric">Inscrições confirmadas<strong>{confirmedSports}</strong></div>
        <div className="metric">Lista de espera<strong>{waitingSports}</strong></div>
      </div>

      <div className="table-wrap"><table><thead><tr><th>Atividade</th><th>Modalidade</th><th>Vagas</th><th>Inscritos</th><th>Espera</th><th>Status</th></tr></thead><tbody>
        {sportRows.map(a=><tr key={a.id}><td>{a.name}</td><td>{a.category.name}</td><td>{a.capacity}</td><td>{a._count.registrations}</td><td>{a._count.waitingList}</td><td><span className="status">{statusLabel(a.status)}</span></td></tr>)}
        {!sportRows.length&&<tr><td colSpan={6}>Nenhuma atividade encontrada com os filtros selecionados.</td></tr>}
      </tbody></table></div>
    </section>}

    {isSecretary&&<div className="metric" style={{maxWidth:300}}>Usuários ativos no portal<strong>{activeUsers}</strong></div>}
  </AppShell>;
}
