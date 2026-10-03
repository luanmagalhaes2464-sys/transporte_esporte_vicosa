import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/PublicLayout";
import { TerritoryMap } from "@/components/TerritoryMap";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/security/authorization";
import { SportsRegisterButton } from "@/components/forms/SportsRegisterButton";
export const dynamic="force-dynamic";
const weekdays=["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
export default async function Page({params}:{params:Promise<{slug:string}>}){
  const{slug}=await params;
  const a=await prisma.sportsActivity.findUnique({where:{slug},include:{category:true,schedules:{orderBy:[{weekday:'asc'},{startTime:'asc'}]},boardingPoints:{where:{active:true},orderBy:{name:'asc'}},_count:{select:{registrations:{where:{status:"CONFIRMED"}},waitingList:{where:{status:{in:["WAITING","CALLED"]}}}}}}});
  if(!a)notFound();
  const user=await currentUser();
  const available=Math.max(0,a.capacity-a._count.registrations);
  let participants:{personId:string;name:string}[]=[];
  if(user){participants.push({personId:user.personId,name:user.person.fullName});const guardian=await prisma.guardian.findFirst({where:{personId:user.personId},include:{students:{include:{student:{include:{person:true}}}}}});for(const link of guardian?.students??[])if(!participants.some(p=>p.personId===link.student.personId))participants.push({personId:link.student.personId,name:link.student.person.fullName})}
  const ageText=a.minAge!=null&&a.maxAge!=null?`${a.minAge} a ${a.maxAge} anos`:a.minAge!=null?`a partir de ${a.minAge} anos`:a.maxAge!=null?`até ${a.maxAge} anos`:'Livre/conforme regulamento';
  const mapPoints=a.latitude!=null&&a.longitude!=null?[{id:a.id,lat:Number(a.latitude),lng:Number(a.longitude),label:a.locationName,kind:'Atividade esportiva'}]:[];
  return <PublicLayout><section className="section"><div className="container-pv activity-layout"><div>{a.imageUrl&&<img src={a.imageUrl} alt={`Imagem da atividade ${a.name}`} style={{width:'100%',maxHeight:380,objectFit:'cover',borderRadius:8,marginBottom:24}}/>}<div className="muted">{a.category.name}{a.classification?` · ${a.classification}`:''}</div><h1 className="section-title">{a.name}</h1><p className="section-lead">{a.description}</p><h2>Sobre</h2>{a.audience&&<p><strong>Público:</strong> {a.audience}</p>}<p><strong>Local:</strong> {a.locationName}</p>{a.addressText&&<p><strong>Endereço:</strong> {a.addressText}</p>}<p><strong>Faixa etária:</strong> {ageText}</p><p><strong>Inscrições até:</strong> {a.registrationEnd.toLocaleDateString("pt-BR")}</p>{a.schedules.length>0&&<><h2>Horários</h2>{a.schedules.map(s=><p key={s.id}>{weekdays[s.weekday]}: {s.startTime}{s.endTime?` – ${s.endTime}`:""}</p>)}</>}{mapPoints.length>0&&<><h2>Localização</h2><TerritoryMap points={mapPoints}/></>}{a.offersTransport&&<><h2>Transporte</h2><p>A atividade oferece transporte{a.transportCapacity?` com ${a.transportCapacity} vagas`:''}. O ponto de embarque é escolhido durante a inscrição.</p>{a.boardingPoints.length>0&&<p><strong>Pontos:</strong> {a.boardingPoints.map(p=>p.name).join(', ')}</p>}</>}{(a.rulesUrl||a.responsibleName||a.contact)&&<><h2>Regulamento e contato</h2>{a.rulesUrl&&<p><a className="btn-secondary" href={a.rulesUrl} target="_blank" rel="noreferrer">Abrir regulamento</a></p>}{a.responsibleName&&<p><strong>Responsável:</strong> {a.responsibleName}</p>}{a.contact&&<p><strong>Contato:</strong> {a.contact}</p>}</>}</div><aside className="activity-aside"><div style={{fontSize:28,fontWeight:800}}>{a._count.registrations} / {a.capacity}</div><p>{available>0?`${available} vagas disponíveis`:`Vagas esgotadas — a inscrição entra na lista de espera`}</p>{a._count.waitingList>0&&<p className="muted">{a._count.waitingList} pessoa(s) aguardando.</p>}{user?<SportsRegisterButton activityId={a.id} offersTransport={a.offersTransport} participants={participants} boardingPoints={a.boardingPoints.map(p=>({id:p.id,name:p.name}))}/>:<Link className="btn-primary" href="/entrar">Entrar para se inscrever</Link>}</aside></div></section></PublicLayout>
}
