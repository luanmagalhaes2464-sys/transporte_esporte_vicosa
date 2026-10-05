import Link from "next/link";
import { redirect } from "next/navigation";
import { SchoolTransportRequestStatus } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requirePermission } from "@/security/authorization";
import { prisma } from "@/lib/prisma";
import { TransportStatusAction } from "@/components/forms/TransportStatusAction";
import { AdminPeriodForm } from "@/components/forms/AdminPeriodForm";
import { DemandMap } from "@/components/DemandMap";
import { statusLabel } from "@/lib/labels";
import { geocodeMunicipalAddress, readableAddress } from "@/modules/territory/geocode-address";

export const dynamic="force-dynamic";

const STATUS_ORDER:SchoolTransportRequestStatus[]=[
  "SUBMITTED","UNDER_REVIEW","PENDING","APPROVED","DENIED","ROUTE_DEFINED","ACTIVE","CANCELED"
];

const addressText = readableAddress;

export default async function Page({searchParams}:{searchParams:Promise<{status?:string}>}){
  try{await requirePermission("school_transport.request.review")}catch{redirect("/cidadao")}
  const params=await searchParams;
  const selectedStatus=STATUS_ORDER.includes(params.status as SchoolTransportRequestStatus)?params.status as SchoolTransportRequestStatus:undefined;

  const allRows=await prisma.schoolTransportRequest.findMany({
    include:{
      student:{include:{person:true}},
      school:true,
      period:{include:{documentRequirements:{where:{active:true,required:true}}}},
      address:{include:{street:true,neighborhood:true,ruralLocality:true}},
      documents:true
    },
    orderBy:{createdAt:"desc"},
    take:300
  });

  const uniqueMissing=[...new Map(
    allRows
      .filter(r=>r.address.latitude==null||r.address.longitude==null)
      .map(r=>[r.address.id,r])
  ).values()].slice(0,5);

  for(const r of uniqueMissing){
    const found=await geocodeMunicipalAddress(r.address);
    if(found){
      await prisma.address.update({
        where:{id:r.address.id},
        data:{latitude:found.latitude,longitude:found.longitude,locationSource:"GEOCODE",locationPrecision:"APPROXIMATE"}
      });
      for(const row of allRows.filter(x=>x.address.id===r.address.id)){
        row.address.latitude=found.latitude as any;
        row.address.longitude=found.longitude as any;
      }
    }
  }

  const countsMap=new Map<SchoolTransportRequestStatus,number>();
  for(const status of STATUS_ORDER)countsMap.set(status,0);
  for(const r of allRows)countsMap.set(r.status,(countsMap.get(r.status)||0)+1);

  const rows=selectedStatus?allRows.filter(r=>r.status===selectedStatus):allRows;

  const points=allRows
    .filter(r=>r.address.latitude&&r.address.longitude)
    .map(r=>({
      id:r.id,
      lat:Number(r.address.latitude),
      lng:Number(r.address.longitude),
      label:r.student.person.fullName,
      school:r.school.name,
      address:addressText(r.address)
    }));

  return <AppShell admin>
    <div className="page-head"><div><h1>Diretoria de Transporte</h1><p className="muted">Analise todas as solicitações, confira os documentos e atualize o andamento de cada aluno.</p></div></div>

    <AdminPeriodForm/>

    <section style={{marginBottom:24}}>
      <h2>Status das solicitações</h2>
      <p className="muted">Clique em um status para filtrar os alunos. “Todas as solicitações” remove o filtro.</p>
      <div className="status-filter-grid">
        <Link href="/admin/transporte#solicitacoes" className={`metric status-filter-card ${!selectedStatus?"selected":""}`}>
          Todas as solicitações<strong>{allRows.length}</strong>
        </Link>
        {STATUS_ORDER.map(status=><Link key={status} href={`/admin/transporte?status=${status}#solicitacoes`} className={`metric status-filter-card ${selectedStatus===status?"selected":""}`}>
          {statusLabel(status)}<strong>{countsMap.get(status)||0}</strong>
        </Link>)}
      </div>
    </section>

    <section style={{marginBottom:24}}>
      <h2>Mapa das residências</h2>
      <p className="muted">Cada marcador representa o endereço residencial usado na solicitação. A Diretoria pode conferir onde o aluno mora e a escola vinculada.</p>
      <DemandMap points={points}/>
      {!points.length&&<div className="alert" style={{marginTop:10}}>Ainda não há solicitações com endereço localizável no mapa.</div>}
    </section>

    <section id="solicitacoes">
      <div className="page-head" style={{marginBottom:12}}>
        <div><h2>{selectedStatus?`Solicitações — ${statusLabel(selectedStatus)}`:"Todas as solicitações"}</h2><p className="muted">{rows.length} registro(s) encontrado(s).</p></div>
        {selectedStatus&&<Link className="btn-ghost" href="/admin/transporte#solicitacoes">Mostrar todas</Link>}
      </div>
      <div className="table-wrap"><table><thead><tr><th>Protocolo</th><th>Aluno</th><th>Escola</th><th>Ano/série</th><th>Turno</th><th>Endereço</th><th>Período</th><th>Documentos</th><th>Status</th><th>Ação</th></tr></thead><tbody>
        {rows.map(r=>{
          const required=r.period.documentRequirements.length;
          const attached=r.documents.filter(d=>d.transportRequirementId&&r.period.documentRequirements.some(req=>req.id===d.transportRequirementId)).length;
          return <tr key={r.id}>
            <td>{r.protocol}</td>
            <td>{r.student.person.fullName}</td>
            <td>{r.school.name}</td>
            <td>{r.grade||"—"}</td>
            <td>{r.shift||"—"}</td>
            <td>{addressText(r.address)||"—"}</td>
            <td>{r.period.name}</td>
            <td><strong>{attached}/{required}</strong>{r.documents.length>0&&<div style={{display:"grid",gap:4,marginTop:6}}>{r.documents.map(d=><a key={d.id} href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer" style={{color:"#B51F2A",fontSize:12}}>Abrir {d.originalFilename}</a>)}</div>}</td>
            <td><span className="status">{statusLabel(r.status)}</span></td>
            <td><TransportStatusAction id={r.id} status={r.status}/></td>
          </tr>;
        })}
        {!rows.length&&<tr><td colSpan={10}>Nenhuma solicitação encontrada neste status.</td></tr>}
      </tbody></table></div>
    </section>
  </AppShell>;
}
