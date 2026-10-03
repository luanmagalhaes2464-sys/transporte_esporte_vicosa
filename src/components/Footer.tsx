import Link from "next/link";
import { Brand } from "./Brand";
import { getPortalSettings } from "@/config/portal";
export async function Footer() {
  const s = await getPortalSettings();
  return <footer className="footer"><div className="container-pv footer-grid"><div><div className="footer-brand"><Brand municipalityName={s.municipalityName} portalName={s.portalName} portalSubtitle={s.portalSubtitle}/></div><p style={{color:"#d3d3d3",maxWidth:520,lineHeight:1.6}}>Serviços digitais de educação, mobilidade escolar e esporte do Município.</p></div><nav aria-label="Links institucionais" style={{display:"grid",gap:8}}><Link href="/acessibilidade">Acessibilidade</Link><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link><Link href="/contato">Contato</Link><Link href="/ajuda">Ajuda</Link></nav></div></footer>;
}
