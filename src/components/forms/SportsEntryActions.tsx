"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function SportsEntryActions({ id, kind }: { id: string; kind: "registration" | "waiting" }) {
  const [busy,setBusy]=useState(false); const [msg,setMsg]=useState(""); const router=useRouter();
  async function cancel(){if(!confirm("Deseja realmente cancelar?"))return;setBusy(true);setMsg("");const url=kind==="registration"?`/api/sports/registrations/${id}/cancel`:`/api/sports/waiting-list/${id}/cancel`;const r=await fetch(url,{method:"POST"});const j=await r.json();setBusy(false);if(!r.ok)return setMsg(j.error||"Não foi possível cancelar.");router.refresh()}
  return <div>{msg&&<small className="alert">{msg}</small>}<button className="btn-ghost" disabled={busy} onClick={cancel}>{busy?"Cancelando...":"Cancelar"}</button></div>;
}
