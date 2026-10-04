"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { statusLabel } from "@/lib/labels";

const NEXT:Record<string,string[]>={
  SUBMITTED:["UNDER_REVIEW","CANCELED"],
  UNDER_REVIEW:["PENDING","APPROVED","DENIED","CANCELED"],
  PENDING:["UNDER_REVIEW","CANCELED"],
  APPROVED:["ROUTE_DEFINED","CANCELED"],
  ROUTE_DEFINED:["ACTIVE","CANCELED"],
  ACTIVE:["CANCELED"]
};

export function TransportStatusAction({id,status}:{id:string;status:string}){
  const[next,setNext]=useState("");
  const[note,setNote]=useState("");
  const[msg,setMsg]=useState("");
  const router=useRouter();
  const options=NEXT[status]||[];
  if(!options.length)return <span className="muted">Sem ação disponível</span>;

  async function submit(){
    if(!next)return;
    const r=await fetch(`/api/school-transport/requests/${id}/status`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({status:next,note:note||undefined})
    });
    const j=await r.json();
    if(!r.ok)return setMsg(j.error||"Não foi possível alterar o status.");
    setMsg("Status atualizado.");
    setNext("");
    setNote("");
    router.refresh();
  }

  return <details>
    <summary style={{cursor:"pointer",fontWeight:700}}>Alterar status</summary>
    <div style={{display:"grid",gap:8,minWidth:210,paddingTop:8}}>
      <select value={next} onChange={e=>setNext(e.target.value)}>
        <option value="">Selecione o novo status</option>
        {options.map(x=><option key={x} value={x}>{statusLabel(x)}</option>)}
      </select>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Observação da diretoria"/>
      <button type="button" className="btn-ghost" onClick={submit}>Salvar status</button>
      {msg&&<small>{msg}</small>}
    </div>
  </details>;
}
