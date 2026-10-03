"use client";

import { useEffect, useState } from "react";

const RULES = [
  "o pedido está sendo encaminhado com antecedência mínima de 7 dias",
  "o transporte será utilizado exclusivamente nos horários permitidos: 07h30–10h30 ou 13h30–15h30",
  "é obrigatória a presença de responsável da escola durante todo o trajeto",
  "todos os passageiros deverão utilizar cinto de segurança",
  "o itinerário não poderá ser alterado sem autorização da Secretaria",
  "cancelamentos deverão ser comunicados com antecedência mínima de 48 horas",
  "o número de passageiros não poderá ultrapassar a capacidade do veículo"
];

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

export function ExtraRequestForm() {
  const [schools, setSchools] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [purpose, setPurpose] = useState("PEDAGOGICAL_VISIT");
  const [shift, setShift] = useState("MORNING");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => setSchools(j.user?.schools || []));
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    const f = new FormData(e.currentTarget);
    const date = String(f.get("activityDate"));
    const departureTime = String(f.get("departureTime"));
    const returnTime = String(f.get("returnTime"));
    const body = {
      schoolId: f.get("schoolId"),
      responsibleName: f.get("responsibleName"),
      responsiblePhone: f.get("responsiblePhone"),
      directorName: f.get("directorName"),
      activity: f.get("activity"),
      purpose: f.get("purpose"),
      purposeOther: f.get("purposeOther") || undefined,
      shift: f.get("shift"),
      departureAt: toIso(date, departureTime),
      returnAt: toIso(date, returnTime),
      origin: f.get("origin"),
      destination: f.get("destination"),
      destinationAddress: f.get("destinationAddress") || undefined,
      studentCount: Number(f.get("studentCount")),
      companionCount: Number(f.get("companionCount")),
      ageRange: f.get("ageRange") || undefined,
      accessibilityNeed: f.get("accessibilityNeed") === "on",
      observations: f.get("observations") || undefined,
      termsAccepted: f.get("termsAccepted") === "on"
    };
    const r = await fetch("/api/extracurricular/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Não foi possível enviar a solicitação.");
    setMsg(`Solicitação enviada à Secretaria. Protocolo ${j.protocol}.`);
    e.currentTarget.reset();
  }

  return <form onSubmit={submit} className="form-grid">
    <div className="field full"><label>1. Nome da Escola *</label><select name="schoolId" required><option value="">Selecione</option>{schools.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></div>
    <div className="field full"><label>Título da Atividade *</label><input name="activity" required /></div>

    <div className="field"><label>Tipo de Atividade *</label><select name="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} required>
      <option value="PEDAGOGICAL_VISIT">Pedagógica</option>
      <option value="CULTURAL_ACTIVITY">Cultural</option>
      <option value="SPORTS_COMPETITION">Esportiva</option>
      <option value="OTHER">Outro</option>
    </select></div>
    <div className="field"><label>Especifique o tipo</label><input name="purposeOther" required={purpose === "OTHER"} disabled={purpose !== "OTHER"} /></div>

    <div className="field"><label>Data da Atividade *</label><input type="date" name="activityDate" required /></div>
    <div className="field"><label>Turno *</label><select name="shift" value={shift} onChange={e => setShift(e.target.value)} required>
      <option value="MORNING">Manhã (07h30 às 10h30)</option>
      <option value="AFTERNOON">Tarde (13h30 às 15h30)</option>
    </select></div>

    <div className="field"><label>Horário de Saída *</label><input type="time" name="departureTime" min={shift === "MORNING" ? "07:30" : "13:30"} max={shift === "MORNING" ? "10:30" : "15:30"} required /></div>
    <div className="field"><label>Horário Previsto de Retorno *</label><input type="time" name="returnTime" min={shift === "MORNING" ? "07:30" : "13:30"} max={shift === "MORNING" ? "10:30" : "15:30"} required /></div>

    <div className="field"><label>Local de Saída *</label><input name="origin" required /></div>
    <div className="field"><label>Local de Destino *</label><input name="destination" required /></div>
    <div className="field full"><label>Endereço do destino</label><input name="destinationAddress" /></div>

    <div className="field"><label>Quantidade de Alunos *</label><input name="studentCount" type="number" min="1" required /></div>
    <div className="field"><label>Quantidade de Servidores/Acompanhantes *</label><input name="companionCount" type="number" min="1" defaultValue="1" required /></div>
    <div className="field"><label>Responsável/Acompanhante dos alunos *</label><input name="responsibleName" required /></div>
    <div className="field"><label>Telefone do Responsável *</label><input name="responsiblePhone" required /></div>
    <div className="field full"><label>Diretor(a) da Escola *</label><input name="directorName" required /></div>

    <div className="field"><label>Faixa etária</label><input name="ageRange" /></div>
    <div className="field"><label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 28 }}><input name="accessibilityNeed" type="checkbox" style={{ width: 18, minHeight: 18 }} /> Necessidade de acessibilidade</label></div>
    <div className="field full"><label>Observações</label><textarea name="observations" /></div>

    <div className="field full" style={{ border: "1px solid #e5e5e5", padding: 16, borderRadius: 10 }}>
      <strong>Declaração de ciência</strong>
      <ul style={{ margin: "10px 0 12px", paddingLeft: 20 }}>{RULES.map(rule => <li key={rule}>{rule};</li>)}</ul>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <input name="termsAccepted" type="checkbox" required style={{ width: 18, minHeight: 18, marginTop: 2 }} />
        Declaro estar ciente e de acordo com as regras acima.
      </label>
    </div>

    {msg && <div className={`alert field full ${msg.startsWith("Solicitação enviada") ? "success" : ""}`}>{msg}</div>}
    <div className="field full"><button className="btn-primary">Enviar Solicitação à Secretaria</button></div>
  </form>;
}
