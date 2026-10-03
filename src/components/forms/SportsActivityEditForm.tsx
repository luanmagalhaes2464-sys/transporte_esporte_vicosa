"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Activity = {
  id:string; name:string; description:string; audience:string|null; minAge:number|null; maxAge:number|null;
  locationName:string; capacity:number; registrationStart:string; registrationEnd:string; activityStart:string; activityEnd:string|null;
  responsibleName:string|null; contact:string|null; status:string;
};

function localDate(value:string|null){
  if(!value)return "";
  const d=new Date(value);
  const pad=(n:number)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SportsActivityEditForm({activity}:{activity:Activity}){
  const [msg,setMsg]=useState("");
  const router=useRouter();

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg("");
    const f=new FormData(e.currentTarget);
    const opt=(k:string)=>{const v=String(f.get(k)||"").trim();return v||undefined};
    const num=(k:string)=>{const v=String(f.get(k)||"").trim();return v?Number(v):undefined};
    const body={
      name:f.get("name"),description:f.get("description"),audience:opt("audience"),
      minAge:num("minAge"),maxAge:num("maxAge"),locationName:f.get("locationName"),
      capacity:Number(f.get("capacity")),registrationStart:f.get("registrationStart"),
      registrationEnd:f.get("registrationEnd"),activityStart:f.get("activityStart"),
      activityEnd:opt("activityEnd"),responsibleName:opt("responsibleName"),
      contact:opt("contact"),status:f.get("status")
    };
    const r=await fetch(`/api/sports/activities/${activity.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok)return setMsg(j.error||"Não foi possível editar a atividade.");
    setMsg("Atividade atualizada.");router.refresh();
  }

  return <details>
    <summary style={{cursor:"pointer",fontWeight:700,color:"#B51F2A"}}>Editar atividade</summary>
    <form className="form-grid" onSubmit={submit} style={{paddingTop:14,minWidth:520}}>
      <div className="field"><label>Nome</label><input name="name" defaultValue={activity.name} required/></div>
      <div className="field"><label>Status</label><select name="status" defaultValue={activity.status}><option value="DRAFT">Rascunho</option><option value="SCHEDULED">Agendado</option><option value="OPEN">Aberto</option><option value="CLOSED">Encerrado</option><option value="CANCELED">Cancelado</option><option value="COMPLETED">Concluído</option></select></div>
      <div className="field full"><label>Descrição</label><textarea name="description" defaultValue={activity.description} required/></div>
      <div className="field"><label>Público</label><input name="audience" defaultValue={activity.audience||""}/></div>
      <div className="field"><label>Local</label><input name="locationName" defaultValue={activity.locationName} required/></div>
      <div className="field"><label>Idade mínima</label><input name="minAge" type="number" min="0" defaultValue={activity.minAge??""}/></div>
      <div className="field"><label>Idade máxima</label><input name="maxAge" type="number" min="0" defaultValue={activity.maxAge??""}/></div>
      <div className="field"><label>Vagas</label><input name="capacity" type="number" min="1" defaultValue={activity.capacity} required/></div>
      <div className="field"><label>Responsável</label><input name="responsibleName" defaultValue={activity.responsibleName||""}/></div>
      <div className="field"><label>Contato</label><input name="contact" defaultValue={activity.contact||""}/></div>
      <div className="field"><label>Início inscrições</label><input name="registrationStart" type="datetime-local" defaultValue={localDate(activity.registrationStart)} required/></div>
      <div className="field"><label>Fim inscrições</label><input name="registrationEnd" type="datetime-local" defaultValue={localDate(activity.registrationEnd)} required/></div>
      <div className="field"><label>Início atividade</label><input name="activityStart" type="datetime-local" defaultValue={localDate(activity.activityStart)} required/></div>
      <div className="field"><label>Fim atividade</label><input name="activityEnd" type="datetime-local" defaultValue={localDate(activity.activityEnd)}/></div>
      {msg&&<div className={`alert field full ${msg==="Atividade atualizada."?"success":""}`}>{msg}</div>}
      <div className="field full"><button className="btn-primary">Salvar alterações</button></div>
    </form>
  </details>;
}
