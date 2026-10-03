import Link from "next/link";
import { Menu } from "lucide-react";
import { Brand } from "./Brand";
import { getPortalSettings } from "@/config/portal";
export async function PublicHeader() {
  const s=await getPortalSettings();
  return <><header className="header-top"><div className="container-pv" style={{display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:82,gap:20}}>
    <Link href="/" aria-label="Ir para o início"><Brand municipalityName={s.municipalityName} portalName={s.portalName} portalSubtitle={s.portalSubtitle}/></Link>
    <nav className="public-nav" aria-label="Navegação principal"><Link href="/">Início</Link><Link href="/servicos">Serviços</Link><Link href="/transporte">Transporte</Link><Link href="/esporte">Esporte</Link><Link href="/cidadao">Acompanhar solicitação</Link><Link href="/ajuda">Ajuda</Link><Link className="btn-primary" href="/entrar">Entrar</Link></nav>
    <Link className="mobile-menu btn-ghost" href="/servicos" aria-label="Abrir serviços"><Menu size={20}/></Link>
  </div></header><div className="header-rule" style={{background:s.primaryColor}}/></>;
}
