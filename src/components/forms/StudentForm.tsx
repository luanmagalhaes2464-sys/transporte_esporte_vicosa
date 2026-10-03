"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type School = { id: string; name: string };
type Issue = { field?: string; message: string };
const RELATIONS = ["Pai","Mãe","Avô","Avó","Padrasto","Madrasta","Tio","Tia","Primo","Prima","Responsável legal","Outro"] as const;

function errorMessages(payload: any): string[] {
  if (Array.isArray(payload?.issues) && payload.issues.length) return payload.issues.map((x: Issue) => x.message);
  const fieldErrors = payload?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const values = Object.values(fieldErrors).flat().filter(Boolean).map(String);
    if (values.length) return values;
  }
  return [payload?.error || "Erro ao cadastrar aluno."];
}

export function StudentForm({ onCreated }: { onCreated?: () => void }) {
  const [schools, setSchools] = useState<School[]>([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [relation, setRelation] = useState("Responsável legal");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/schools")
      .then(async r => r.ok ? r.json() : [])
      .then(data => setSchools(Array.isArray(data) ? data : []))
      .catch(() => setSchools([]));
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setErrors([]);
    const form = e.currentTarget;
    const f = new FormData(form);
    const body = {
      fullName: f.get("fullName"),
      cpf: f.get("cpf") || undefined,
      birthDate: f.get("birthDate"),
      schoolId: f.get("schoolId"),
      grade: f.get("grade"),
      shift: f.get("shift"),
      relation: f.get("relation"),
      relationOther: f.get("relationOther") || undefined
    };
    const r = await fetch("/api/citizen/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!r.ok) {
      setErrors(errorMessages(j));
      return;
    }
    form.reset();
    setRelation("Responsável legal");
    setMessage("Aluno/dependente cadastrado com sucesso.");
    onCreated?.();
    router.refresh();
  }

  return <form onSubmit={submit} className="form-grid">
    <div className="field full"><label>Nome do aluno</label><input name="fullName" required /></div>
    <div className="field"><label>CPF (se possuir)</label><input name="cpf" inputMode="numeric" /></div>
    <div className="field"><label>Nascimento</label><input type="date" name="birthDate" required /></div>
    <div className="field full"><label>Escola</label><select name="schoolId" required><option value="">Selecione</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
    <div className="field"><label>Ano/série</label><input name="grade" required /></div>
    <div className="field"><label>Turno</label><select name="shift" required><option value="">Selecione</option><option>Manhã</option><option>Tarde</option><option>Noite</option><option>Integral</option></select></div>
    <div className="field full"><small className="muted">Escola, série e turno serão reutilizados automaticamente nas solicitações de transporte escolar.</small></div>
    <div className="field full"><label>Relação com o aluno</label><select name="relation" value={relation} onChange={e => setRelation(e.target.value)} required>{RELATIONS.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
    {relation === "Outro" && <div className="field full"><label>Especifique a relação</label><input name="relationOther" placeholder="Ex.: irmão, irmã, tutor..." required /></div>}

    {errors.length > 0 && <div className="alert field full"><strong>Não foi possível cadastrar o aluno:</strong><ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>{errors.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}
    {message && <div className="alert success field full">{message}</div>}
    <div className="field full"><button className="btn-primary">Salvar aluno</button></div>
  </form>;
}
