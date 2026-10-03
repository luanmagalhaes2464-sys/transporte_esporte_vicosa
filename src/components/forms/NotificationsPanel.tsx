"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type NotificationRow = { id:string; title:string; message:string; status:string; readAt:Date|string|null; createdAt:Date|string };

export function NotificationsPanel({ rows }:{ rows:NotificationRow[] }) {
  const [busy,setBusy]=useState<string|null>(null); const router=useRouter();
  async function mark(id:string){setBusy(id);try{await fetch(`/api/notifications/${id}/read`,{method:"POST"});router.refresh()}finally{setBusy(null)}}
  if(!rows.length) return <div className="panel"><p className="muted">Nenhuma notificação no momento.</p></div>;
  return <div style={{display:"grid",gap:12}}>{rows.map(n=><article key={n.id} className="panel" style={{borderLeft:n.readAt?"4px solid #e5e5e5":"4px solid #B51F2A"}}><div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start"}}><div><h3 style={{marginTop:0,marginBottom:6}}>{n.title}</h3><p style={{margin:0,lineHeight:1.55}}>{n.message}</p><small className="muted">{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(n.createdAt))}</small></div>{!n.readAt&&<button className="btn-ghost" disabled={busy===n.id} onClick={()=>mark(n.id)}>{busy===n.id?"Salvando...":"Marcar como lida"}</button>}</div></article>)}</div>;
}
