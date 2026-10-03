"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type School = { id: string; name: string };

export function AdminPeriodForm() {
  const [msg, setMsg] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const router = useRouter();
  useEffect(() => { fetch("/api/schools").then(r => r.json()).then(j => setSchools(Array.isArray(j) ? j : [])).catch(() => setSchools([])); }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg("");
    const f = new FormData(e.currentTarget);
    const schoolIds = f.getAll("schoolIds").map(String);
    const documentRequirements = String(f.get("documents") || "").split("\n").map(x => x.trim()).filter(Boolean).map(name => ({ name, required: true }));
    const body = { name: f.get("name"), academicYear: Number(f.get("academicYear")), requestStart: f.get("requestStart"), requestEnd: f.get("requestEnd"), rules: f.get("rules") || undefined, status: f.get("status"), schoolIds, documentRequirements };
    const r = await fetch("/api/school-transport/periods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json(); if (!r.ok) return setMsg(j.error || "Erro ao criar período.");
    setMsg("Período criado."); e.currentTarget.reset(); router.refresh();
  }

  return <details style={{ background: "white", border: "1px solid #e5e5e5", padding: 16, borderRadius: 8, marginBottom: 20 }}>
    <summary style={{ cursor: "pointer", fontWeight: 800 }}>Criar período de transporte escolar</summary>
    <form className="form-grid" onSubmit={submit} style={{ paddingTop: 16 }}>
      <div className="field full"><label>Nome</label><input name="name" placeholder="Transporte Escolar 2027" required /></div>
      <div className="field"><label>Ano letivo</label><input name="academicYear" type="number" min="2020" max="2100" required /></div>
      <div className="field"><label>Status</label><select name="status"><option value="DRAFT">Rascunho</option><option value="SCHEDULED">Agendado</option><option value="OPEN">Aberto</option><option value="CLOSED">Encerrado</option></select></div>
      <div className="field"><label>Início das solicitações</label><input name="requestStart" type="datetime-local" required /></div>
      <div className="field"><label>Fim</label><input name="requestEnd" type="datetime-local" required /></div>
      <div className="field full"><label>Regras</label><textarea name="rules" /></div>
      <div className="field full"><label>Escolas participantes</label><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 8, border: "1px solid #e5e5e5", padding: 12, borderRadius: 6 }}>{schools.map(s => <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" name="schoolIds" value={s.id} style={{ width: 18, minHeight: 18 }} />{s.name}</label>)}{!schools.length && <span className="muted">Cadastre escolas antes, ou deixe vazio para não restringir o período.</span>}</div></div>
      <div className="field full"><label>Documentos obrigatórios (um por linha)</label><textarea name="documents" placeholder={'Comprovante de matrícula\nComprovante de residência'} /></div>
      {msg && <div className={`alert field full ${msg === "Período criado." ? "success" : ""}`}>{msg}</div>}
      <div className="field full"><button className="btn-primary">Criar período</button></div>
    </form>
  </details>;
}
