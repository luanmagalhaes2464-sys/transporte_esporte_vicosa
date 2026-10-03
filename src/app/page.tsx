import Link from "next/link";
import { Bus, GraduationCap, Trophy, ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export default async function Home() {
  let activities: Array<{id:string;name:string;slug:string;capacity:number;registrationEnd:Date;_count:{registrations:number}}> = [];
  let transportOpen = false;
  try {
    const now = new Date();
    activities = await prisma.sportsActivity.findMany({ where:{active:true,status:"OPEN",registrationStart:{lte:now},registrationEnd:{gte:now}}, take:3, orderBy:{registrationEnd:"asc"}, select:{id:true,name:true,slug:true,capacity:true,registrationEnd:true,_count:{select:{registrations:{where:{status:"CONFIRMED"}}}}} });
    transportOpen = Boolean(await prisma.schoolTransportPeriod.findFirst({ where:{status:"OPEN",requestStart:{lte:now},requestEnd:{gte:now}} }));
  } catch {}
  return <PublicLayout>
    <section className="hero"><div className="container-pv"><div className="hero-content"><div className="hero-kicker">SERVIÇOS PARA VOCÊ</div><h1>Educação, transporte e esporte em um só lugar.</h1><p>Solicite transporte escolar, acompanhe seus pedidos e inscreva-se nas atividades oferecidas pelo Município de Viçosa.</p><div className="hero-actions"><Link className="btn-primary" href="/servicos">ACESSAR SERVIÇOS</Link><Link className="btn-secondary" href="/cidadao">ACOMPANHAR SOLICITAÇÃO</Link></div></div></div></section>
    <section className="section"><div className="container-pv"><h2 className="section-title">Serviços disponíveis</h2><p className="section-lead">Escolha o serviço que você precisa. O mesmo cadastro é utilizado em todo o portal.</p><div className="service-grid">
      <article className="service-card"><div className="service-image-wrap"><img className="service-image-img" src="/images/escolar.png?v=4" alt="Ônibus do transporte escolar" /></div><div className="service-body"><Bus color="#B51F2A"/><h3>Transporte Escolar</h3><p>Solicite e acompanhe o transporte escolar.</p><Link className="btn-primary" href="/transporte">SOLICITAR TRANSPORTE</Link></div></article>
      <article className="service-card"><div className="service-image-wrap"><img className="service-image-img" src="/images/TransporteExtraclasse.png?v=4" alt="Alunos embarcando no transporte extraclasse" /></div><div className="service-body"><GraduationCap color="#B51F2A"/><h3>Transporte Extraclasse</h3><p>Área destinada às escolas para visitas, eventos, atividades pedagógicas e competições.</p><Link className="btn-primary" href="/escola">ÁREA DA ESCOLA</Link></div></article>
      <article className="service-card"><div className="service-image-wrap"><img className="service-image-img" src="/images/esporte.png?v=4" alt="Equipamentos de esporte e lazer" /></div><div className="service-body"><Trophy color="#B51F2A"/><h3>Esporte e Lazer</h3><p>Confira atividades esportivas, escolinhas, campeonatos e inscrições abertas.</p><Link className="btn-primary" href="/esporte">VER ATIVIDADES</Link></div></article>
    </div></div></section>
    <section className="section section-soft"><div className="container-pv"><h2 className="section-title">Inscrições abertas</h2><p className="section-lead">Oportunidades publicadas pelas secretarias aparecem aqui automaticamente.</p><div className="opportunity-grid">
      {activities.map(a => <article className="opportunity" key={a.id}><h3>{a.name}</h3><p><strong>{Math.max(0,a.capacity-a._count.registrations)} vagas disponíveis</strong></p><p className="muted">Inscrições até {a.registrationEnd.toLocaleDateString("pt-BR")}</p><Link href={`/esporte/${a.slug}`} style={{display:"inline-flex",alignItems:"center",gap:6,color:"#B51F2A",fontWeight:700}}>VER ATIVIDADE <ArrowRight size={16}/></Link></article>)}
      {transportOpen && <article className="opportunity"><h3>Transporte Escolar</h3><p><strong>Solicitações abertas</strong></p><Link href="/transporte" style={{color:"#B51F2A",fontWeight:700}}>SOLICITAR</Link></article>}
      {!activities.length && !transportOpen && <article className="opportunity"><h3>Nenhuma inscrição aberta no momento</h3><p className="muted">Novas oportunidades serão publicadas aqui.</p></article>}
    </div></div></section>
  </PublicLayout>;
}
