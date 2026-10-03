"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExtraCancelButton({ id, departureAt, status }: { id: string; departureAt: string; status: string }) {
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const terminal = ["COMPLETED","DENIED","CANCELED"].includes(status);
  const canCancel = new Date(departureAt).getTime() - Date.now() >= 48 * 60 * 60 * 1000;
  if (terminal) return null;
  async function cancel() {
    if (!confirm("Deseja cancelar esta solicitação? O cancelamento deve ocorrer com antecedência mínima de 48 horas.")) return;
    const r = await fetch(`/api/extracurricular/requests/${id}/cancel`, { method: "POST" });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Não foi possível cancelar.");
    router.refresh();
  }
  return <div style={{marginTop:6}}>
    <button className="btn-ghost" type="button" onClick={cancel} disabled={!canCancel}>{canCancel ? "Cancelar solicitação" : "Prazo de cancelamento encerrado"}</button>
    {msg && <small style={{display:"block"}}>{msg}</small>}
  </div>;
}
