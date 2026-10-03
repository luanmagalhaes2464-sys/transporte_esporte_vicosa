import { PublicLayout } from "@/components/PublicLayout";
import { getPortalSettings } from "@/config/portal";
export const dynamic='force-dynamic';
export default async function Page(){const s=await getPortalSettings();return <PublicLayout><section className="section"><div className="container-pv"><h1 className="section-title">Contato</h1><p className="section-lead">Canais de atendimento do portal municipal.</p><div className="panel"><p><strong>Município:</strong> {s.municipalityName}</p><p><strong>E-mail de suporte:</strong> {s.supportEmail||'A definir pela administração'}</p><p className="muted">Os canais oficiais podem ser atualizados pela área administrativa sem alteração no código.</p></div></div></section></PublicLayout>}
