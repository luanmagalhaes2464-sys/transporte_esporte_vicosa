"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Period = { id: string; name: string; status: string; requestStart: string; requestEnd: string };
type Student = {
  id: string;
  grade?: string | null;
  shift?: string | null;
  person?: { fullName?: string } | null;
  school?: { id: string; name: string } | null;
};
type Address = {
  id: string;
  addressType: "URBAN" | "RURAL";
  number?: string | null;
  street?: { name: string } | null;
  neighborhood?: { name: string } | null;
  ruralLocality?: { name: string } | null;
  ruralRoad?: string | null;
  km?: string | null;
};

function addressLabel(a?: Address) {
  if (!a) return "";
  return a.addressType === "URBAN"
    ? [a.street?.name, a.number, a.neighborhood?.name].filter(Boolean).join(", ")
    : [a.ruralLocality?.name, a.ruralRoad, a.km].filter(Boolean).join(", ");
}

export function TransportRequestForm() {
  const router = useRouter();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/school-transport/periods").then(r => r.json()),
      fetch("/api/citizen/students").then(r => r.json()),
      fetch("/api/citizen/addresses").then(r => r.json())
    ]).then(([p, s, a]) => {
      const now = Date.now();
      const open = Array.isArray(p)
        ? p.filter((x: Period) => x.status === "OPEN" && new Date(x.requestStart).getTime() <= now && new Date(x.requestEnd).getTime() >= now)
        : [];
      setPeriods(open);
      if (open.length === 1) setPeriodId(open[0].id);
      setStudents(Array.isArray(s) ? s : []);
      setAddresses(Array.isArray(a) ? a : []);
    });
  }, []);

  const student = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
  const address = addresses[0];
  const ready = Boolean(periodId && studentId && address && student?.school && student?.grade && student?.shift);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready) return;
    setMsg("");
    const f = new FormData(e.currentTarget);
    const body = {
      periodId,
      studentId,
      accessibilityNeed: f.get("accessibilityNeed") === "on",
      accessibilityInfo: f.get("accessibilityInfo") || undefined,
      observations: f.get("observations") || undefined
    };
    const r = await fetch("/api/school-transport/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Não foi possível enviar a solicitação.");
    setMsg(`Solicitação criada. Protocolo ${j.protocol}.`);
    router.push(`/transporte/${j.id}`);
  }

  return <form onSubmit={submit} className="form-grid">
    <div className="field full">
      <label>Período</label>
      {periods.length === 0
        ? <div className="alert">Não há período de solicitação aberto no momento.</div>
        : periods.length === 1
          ? <><input value={periods[0].name} readOnly /><small className="muted">Período selecionado automaticamente.</small></>
          : <select value={periodId} onChange={e => setPeriodId(e.target.value)} required><option value="">Selecione</option>{periods.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select>}
    </div>

    <div className="field full">
      <label>Aluno</label>
      <select value={studentId} onChange={e => setStudentId(e.target.value)} required>
        <option value="">Selecione</option>
        {students.map(s => <option value={s.id} key={s.id}>{s.person?.fullName || s.id}</option>)}
      </select>
      <small className="muted">Escola, série e turno são reaproveitados do cadastro do aluno.</small>
    </div>

    {student && <div className="field full">
      <div className="panel" style={{ padding: 16 }}>
        <strong>Dados escolares já cadastrados</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginTop: 10 }}>
          <div><small className="muted">Escola</small><div>{student.school?.name || "Não informada"}</div></div>
          <div><small className="muted">Ano / série</small><div>{student.grade || "Não informado"}</div></div>
          <div><small className="muted">Turno</small><div>{student.shift || "Não informado"}</div></div>
        </div>
        {(!student.school || !student.grade || !student.shift) && <div className="alert" style={{ marginTop: 12 }}>Complete escola, série e turno no cadastro do aluno antes de solicitar o transporte.</div>}
      </div>
    </div>}

    <div className="field full">
      <label>Endereço residencial</label>
      {address
        ? <><input value={addressLabel(address) || "Endereço cadastrado"} readOnly /><small className="muted">Usaremos automaticamente o endereço residencial principal.</small></>
        : <div className="alert">Cadastre seu endereço residencial em <Link href="/cidadao" style={{ fontWeight: 700 }}>Meus serviços</Link> antes de solicitar.</div>}
    </div>

    <div className="field full">
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input name="accessibilityNeed" type="checkbox" style={{ width: 18, minHeight: 18 }}/> Necessidade de acessibilidade</label>
    </div>
    <div className="field full"><label>Detalhes de acessibilidade</label><input name="accessibilityInfo"/></div>
    <div className="field full"><label>Observações</label><textarea name="observations"/></div>
    {msg && <div className={`alert field full ${msg.startsWith("Solicitação criada") ? "success" : ""}`}>{msg}</div>}
    <div className="field full"><button className="btn-primary" disabled={!ready}>Enviar solicitação</button></div>
  </form>;
}
