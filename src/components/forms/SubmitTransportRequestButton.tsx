"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function SubmitTransportRequestButton({ requestId }: { requestId: string }) {
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit() { setBusy(true); setMsg(""); const r = await fetch(`/api/school-transport/requests/${requestId}/submit`, { method: "POST" }); const j = await r.json(); if (!r.ok) setMsg(j.error || "Não foi possível enviar."); else { setMsg("Solicitação enviada para análise."); router.refresh(); } setBusy(false); }
  return <div><button className="btn-primary" type="button" disabled={busy} onClick={submit}>{busy ? "Enviando..." : "ENVIAR SOLICITAÇÃO"}</button>{msg && <div className={`alert ${msg.startsWith("Solicitação enviada") ? "success" : ""}`} style={{ marginTop: 12 }}>{msg}</div>}</div>;
}
