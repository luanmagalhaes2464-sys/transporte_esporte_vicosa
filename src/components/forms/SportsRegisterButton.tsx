"use client";
import { useState } from "react";

type Point = { id: string; name: string };
type Participant = { personId: string; name: string };
export function SportsRegisterButton({ activityId, offersTransport = false, boardingPoints = [], participants = [] }: { activityId: string; offersTransport?: boolean; boardingPoints?: Point[]; participants?: Participant[] }) {
  const [msg, setMsg] = useState(""); const [wants, setWants] = useState(false); const [boardingPointId, setBoardingPointId] = useState(""); const [participantPersonId,setParticipantPersonId]=useState(participants[0]?.personId??"");
  async function go() {
    setMsg("");
    if(participants.length>1&&!participantPersonId){setMsg("Selecione quem participará da atividade.");return}
    const r = await fetch(`/api/sports/activities/${activityId}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantPersonId:participantPersonId||undefined, wantsTransport: wants, boardingPointId: wants && boardingPointId ? boardingPointId : null }) });
    const j = await r.json(); if (!r.ok) { setMsg(j.error || "Não foi possível realizar a inscrição."); return; }
    setMsg(j.kind === "registration" ? `Inscrição confirmada. Protocolo ${j.row.protocol}.` : `Atividade lotada. Você está na lista de espera na posição ${j.row.position}.`);
  }
  return <div style={{ display: "grid", gap: 12 }}>
    {participants.length>0&&<label>Participante<select value={participantPersonId} onChange={e=>setParticipantPersonId(e.target.value)} required><option value="">Selecione</option>{participants.map(p=><option key={p.personId} value={p.personId}>{p.name}</option>)}</select></label>}
    {offersTransport && <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={wants} onChange={e => { setWants(e.target.checked); if (!e.target.checked) setBoardingPointId(""); }} /> Desejo utilizar transporte</label>}
    {offersTransport && wants && boardingPoints.length > 0 && <label>Ponto de embarque<select value={boardingPointId} onChange={e => setBoardingPointId(e.target.value)} required><option value="">Selecione</option>{boardingPoints.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
    <button className="btn-primary" onClick={go}>INSCREVER-SE</button>
    {msg && <div className={`alert ${msg.startsWith("Inscrição confirmada") || msg.startsWith("Atividade lotada") ? "success" : ""}`}>{msg}</div>}
  </div>;
}
