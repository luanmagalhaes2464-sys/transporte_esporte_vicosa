"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  requestId: string;
  requirementId: string;
  requirementName: string;
  currentFilename?: string | null;
};

async function sha256(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function DocumentUploader({ requestId, requirementId, requirementName, currentFilename }: Props) {
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setMsg("");
    try {
      const targetRes = await fetch("/api/documents/upload-target", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, mimeType: file.type, sizeBytes: file.size }) });
      const target = await targetRes.json(); if (!targetRes.ok) throw new Error(target.error || "Não foi possível iniciar o upload.");
      const put = await fetch(target.url, { method: "PUT", headers: target.headers || { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error("Falha ao enviar o arquivo para o armazenamento.");
      const completeRes = await fetch("/api/documents/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerType: "SCHOOL_TRANSPORT_REQUEST", storageKey: target.key, originalFilename: file.name, mimeType: file.type, sizeBytes: file.size, sha256: await sha256(file), transportRequestId: requestId, transportRequirementId: requirementId }) });
      const complete = await completeRes.json(); if (!completeRes.ok) throw new Error(complete.error || "Não foi possível registrar o documento.");
      setMsg("Documento anexado."); router.refresh();
    } catch (err) { setMsg(err instanceof Error ? err.message : "Não foi possível anexar o documento."); }
    finally { setBusy(false); e.target.value = ""; }
  }
  return <div style={{ border: "1px solid #e5e5e5", borderRadius: 7, padding: 14 }}><strong>{requirementName}</strong><div className="muted" style={{ margin: "4px 0 10px" }}>{currentFilename ? `Arquivo atual: ${currentFilename}` : "Documento obrigatório ainda não anexado."}</div><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={upload} disabled={busy} />{msg && <div className={`alert ${msg === "Documento anexado." ? "success" : ""}`} style={{ marginTop: 10 }}>{msg}</div>}</div>;
}
