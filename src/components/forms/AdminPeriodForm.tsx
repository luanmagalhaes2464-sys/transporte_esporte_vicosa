"use client";
import { useEffect,useMemo,useState } from "react";
import { useRouter } from "next/navigation";

type School={id:string;name:string};
type Period={id:string;name:string;academicYear:number;requestStart:string;requestEnd:string;rules?:string|null;status:string;schools:{school:{id:string;name:string}}[];documentRequirements:{id:string;name:string;required:boolean;active:boolean}[]};

function localDate(value:string){
  const d=new Date(value);const pad=(n:number)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminPeriodForm(){
  const[msg,setMsg]=useState("");
  const[schools,setSchools]=useState<School[]>([]);
  const[periods,setPeriods]=useState<Period[]>([]);
  const[selectedId,setSelectedId]=useState("");
  const router=useRouter();

  async function load(){
    const[sc,ps]=await Promise.all([fetch("/api/schools").then(r=>r.json()),fetch("/api/school-transport/periods").then(r=>r.json())]);
    setSchools(Array.isArray(sc)?sc:[]);
    setPeriods(Array.isArray(ps)?ps:[]);
    if(Array.isArray(ps)&&ps.length&&!selectedId)setSelectedId(ps[0].id);
  }
  useEffect(()=>{load().catch(()=>{})},[]);
  const selected=useMemo(()=>periods.find(p=>p.id===selectedId),[periods,selectedId]);

  function docs(f:FormData){return String(f.get("documents")||"").split("\n").map(x=>x.trim()).filter(Boolean).map(name=>({name,required:true}))}

  async function create(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg("");
    const f=new FormData(e.currentTarget);
    const body={name:f.get("name"),academicYear:Number(f.get("academicYear")),requestStart:f.get("requestStart"),requestEnd:f.get("requestEnd"),rules:f.get("rules")||undefined,status:f.get("status"),schoolIds:f.getAll("schoolIds").map(String),documentRequirements:docs(f)};
    const r=await fetch("/api/school-transport/periods",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const j=await r.json();if(!r.ok)return setMsg(j.error||"Erro ao criar período.");
    setMsg("Período criado.");e.currentTarget.reset();await load();router.refresh();
  }

  async function update(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();if(!selected)return;setMsg("");
    const f=new FormData(e.currentTarget);
    const body={name:f.get("name"),academicYear:Number(f.get("academicYear")),requestStart:f.get("requestStart"),requestEnd:f.get("requestEnd"),rules:f.get("rules")||undefined,status:f.get("status"),schoolIds:f.getAll("schoolIds").map(String),documentRequirements:docs(f)};
    const r=await fetch(`/api/school-transport/periods/${selected.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const j=await r.json();if(!r.ok)return setMsg(j.error||"Erro ao atualizar período.");
    setMsg("Período atualizado.");await load();router.refresh();
  }

  return <div style={{display:"grid",gap:14,marginBottom:20}}>
    <details className="panel" open>
      <summary style={{cursor:"pointer",fontWeight:800}}>Configurar período e documentos obrigatórios</summary>
      <div className="field" style={{marginTop:14,marginBottom:14}}><label>Período</label><select value={selectedId} onChange={e=>setSelectedId(e.target.value)}>{periods.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      {selected&&<form key={selected.id} className="form-grid" onSubmit={update}>
        <div className="field full"><label>Nome</label><input name="name" defaultValue={selected.name} required/></div>
        <div className="field"><label>Ano letivo</label><input name="academicYear" type="number" min="2020" max="2100" defaultValue={selected.academicYear} required/></div>
        <div className="field"><label>Status</label><select name="status" defaultValue={selected.status}><option value="DRAFT">Rascunho</option><option value="SCHEDULED">Agendado</option><option value="OPEN">Aberto</option><option value="CLOSED">Encerrado</option></select></div>
        <div className="field"><label>Início das solicitações</label><input name="requestStart" type="datetime-local" defaultValue={localDate(selected.requestStart)} required/></div>
        <div className="field"><label>Fim</label><input name="requestEnd" type="datetime-local" defaultValue={localDate(selected.requestEnd)} required/></div>
        <div className="field full"><label>Regras</label><textarea name="rules" defaultValue={selected.rules||""}/></div>
        <div className="field full"><label>Escolas participantes</label><div className="check-grid">{schools.map(s=><label key={s.id}><input type="checkbox" name="schoolIds" value={s.id} defaultChecked={selected.schools.some(x=>x.school.id===s.id)}/>{s.name}</label>)}</div></div>
        <div className="field full"><label>Documentos obrigatórios (um por linha)</label><textarea name="documents" defaultValue={selected.documentRequirements.filter(d=>d.active).map(d=>d.name).join("\n")} placeholder={"Comprovante de matrícula\nComprovante de residência"}/><small className="muted">Cada linha vira um campo de upload obrigatório para o responsável.</small></div>
        <div className="field full"><button className="btn-primary">Salvar período e documentos</button></div>
      </form>}
    </details>

    <details className="panel">
      <summary style={{cursor:"pointer",fontWeight:800}}>Criar novo período de transporte escolar</summary>
      <form className="form-grid" onSubmit={create} style={{paddingTop:16}}>
        <div className="field full"><label>Nome</label><input name="name" placeholder="Transporte Escolar 2028" required/></div>
        <div className="field"><label>Ano letivo</label><input name="academicYear" type="number" min="2020" max="2100" required/></div>
        <div className="field"><label>Status</label><select name="status"><option value="DRAFT">Rascunho</option><option value="SCHEDULED">Agendado</option><option value="OPEN">Aberto</option><option value="CLOSED">Encerrado</option></select></div>
        <div className="field"><label>Início das solicitações</label><input name="requestStart" type="datetime-local" required/></div>
        <div className="field"><label>Fim</label><input name="requestEnd" type="datetime-local" required/></div>
        <div className="field full"><label>Regras</label><textarea name="rules"/></div>
        <div className="field full"><label>Escolas participantes</label><div className="check-grid">{schools.map(s=><label key={s.id}><input type="checkbox" name="schoolIds" value={s.id}/>{s.name}</label>)}</div></div>
        <div className="field full"><label>Documentos obrigatórios (um por linha)</label><textarea name="documents" defaultValue={"Comprovante de matrícula\nComprovante de residência"}/></div>
        <div className="field full"><button className="btn-primary">Criar período</button></div>
      </form>
    </details>
    {msg&&<div className={`alert ${msg.includes("atualizado")||msg.includes("criado")?"success":""}`}>{msg}</div>}
  </div>;
}
