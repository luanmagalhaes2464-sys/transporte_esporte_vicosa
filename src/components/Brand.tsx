"use client";
import { useState } from "react";
export function Brand({ compact = false, municipalityName="Prefeitura de Viçosa", portalName="Portal Viçosa", portalSubtitle="Educação, Transporte e Esporte" }: { compact?: boolean; municipalityName?:string; portalName?:string; portalSubtitle?:string }) {
  const [failed, setFailed] = useState(false);
  return <div className="brand-lockup">
    {failed ? <div className="brand-crest-fallback">BRASÃO<br/>VIÇOSA</div> : <img className="brand-crest" src="/brand/brasao-vicosa.png" alt="Brasão do Município de Viçosa" onError={() => setFailed(true)} />}
    <div><div style={{fontWeight:800,fontSize: compact ? 14 : 15}}>{municipalityName}</div><div className="brand-subtitle" style={{fontSize:12,color:"#666",marginTop:2}}>{portalName} · {portalSubtitle}</div></div>
  </div>;
}
