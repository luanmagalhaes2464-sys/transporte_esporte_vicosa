"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function ageFromIso(value: string) {
  if (!value) return null;
  const birth = new Date(`${value}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

export function RegisterForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const router = useRouter();
  const minor = useMemo(() => {
    const age = ageFromIso(birthDate);
    return age !== null && age < 18;
  }, [birthDate]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError("");
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(f.entries());
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json(); setLoading(false);
    if (!r.ok) return setError(j.error || "Não foi possível criar a conta.");
    router.push("/cidadao"); router.refresh();
  }

  return <form onSubmit={submit} className="form-grid">
    <div className="field full"><label>Nome completo</label><input name="fullName" autoComplete="name" required /></div>
    <div className="field"><label>CPF</label><input name="cpf" inputMode="numeric" autoComplete="off" required /></div>
    <div className="field"><label>Data de nascimento</label><input name="birthDate" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required /></div>
    <div className="field"><label>E-mail</label><input name="email" type="email" autoComplete="email" required /></div>
    <div className="field"><label>Telefone</label><input name="phone" type="tel" autoComplete="tel" required /></div>

    {minor && <fieldset className="field full" style={{ border: "1px solid #e5e5e5", padding: 18, borderRadius: 8 }}>
      <legend style={{ fontWeight: 800, padding: "0 6px" }}>Responsável legal</legend>
      <p className="muted" style={{ marginTop: 0 }}>Como o titular é menor de 18 anos, os dados do responsável são obrigatórios.</p>
      <div className="form-grid">
        <div className="field full"><label>Nome do responsável</label><input name="guardianFullName" required={minor} /></div>
        <div className="field"><label>CPF do responsável</label><input name="guardianCpf" inputMode="numeric" required={minor} /></div>
        <div className="field"><label>Telefone do responsável</label><input name="guardianPhone" type="tel" required={minor} /></div>
        <div className="field full"><label>Relação com o aluno</label><input name="guardianRelation" placeholder="Ex.: mãe, pai, avó, responsável legal" required={minor} /></div>
      </div>
    </fieldset>}

    <div className="field full"><label>Senha</label><input name="password" type="password" minLength={10} autoComplete="new-password" required /><small className="muted">Use pelo menos 10 caracteres.</small></div>
    {error && <div className="alert field full">{error}</div>}
    <div className="field full"><button className="btn-primary" disabled={loading}>{loading ? "Criando conta..." : "Criar cadastro único"}</button></div>
  </form>;
}
