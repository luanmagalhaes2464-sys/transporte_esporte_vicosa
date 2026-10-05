"use client";
import { useEffect,useState } from "react";
import { LocationPicker } from "@/components/LocationPicker";

type Result={type:string;id:string;name:string;neighborhoods?:{id:string;name:string}[]};

export function AddressForm({onCreated}:{onCreated?:()=>void}){
  const[type,setType]=useState<"URBAN"|"RURAL">("URBAN");
  const[cep,setCep]=useState("");
  const[street,setStreet]=useState<Result|null>(null); const[streetText,setStreetText]=useState("");
  const[neighborhood,setNeighborhood]=useState<Result|null>(null); const[neighborhoodText,setNeighborhoodText]=useState("");
  const[rural,setRural]=useState<Result|null>(null); const[ruralText,setRuralText]=useState("");
  const[number,setNumber]=useState(""); const[complement,setComplement]=useState("");
  const[suggestions,setSuggestions]=useState<Result[]>([]);
  const[msg,setMsg]=useState("");
  const[position,setPosition]=useState<[number,number]|undefined>();
  const[aiEnabled,setAiEnabled]=useState(false);
  const[reading,setReading]=useState(false);

  useEffect(()=>{fetch("/api/address-proof/status").then(r=>r.json()).then(j=>setAiEnabled(Boolean(j.enabled))).catch(()=>setAiEnabled(false))},[]);

  async function search(q:string){
    if(q.trim().length<2){setSuggestions([]);return}
    const j=await fetch(`/api/territory/search?q=${encodeURIComponent(q)}`).then(r=>r.json());
    setSuggestions(j.results||[]);
  }

  async function applyCep(value:string){
    const digits=value.replace(/\D/g,"");
    if(digits.length!==8)return;
    const r=await fetch(`/api/cep/${digits}`);const j=await r.json();
    if(!r.ok)return;
    setCep(j.cep||digits);

    if(j.matches?.street){
      const x={type:"STREET",...j.matches.street};
      setStreet(x);setStreetText(x.name);
    } else if(j.street){
      setStreet(null);setStreetText(j.street);
    }

    if(j.matches?.neighborhood){
      const x={type:"NEIGHBORHOOD",...j.matches.neighborhood};
      setNeighborhood(x);setNeighborhoodText(x.name);
    } else if(j.neighborhood){
      setNeighborhood(null);setNeighborhoodText(j.neighborhood);
      const sr=await fetch(`/api/territory/search?q=${encodeURIComponent(j.neighborhood)}`);
      const sj=await sr.json();
      const exact=(sj.results||[]).find((x:Result)=>x.type==="NEIGHBORHOOD"&&x.name.localeCompare(j.neighborhood,"pt-BR",{sensitivity:"base"})===0);
      if(exact)setNeighborhood(exact);
    }
  }

  async function lookup(){
    setMsg("");
    const r=await fetch(`/api/cep/${cep}`);const j=await r.json();
    if(!r.ok){setMsg(j.error);return}
    await applyCep(cep);
    setMsg("CEP consultado. Confira rua, bairro e número antes de salvar.");
  }

  async function readProof(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return;
    setReading(true);setMsg("");
    try{
      const form=new FormData();form.set("file",file);
      const r=await fetch("/api/address-proof/extract",{method:"POST",body:form});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||"Não foi possível ler o comprovante.");
      if(j.cep){setCep(j.cep);await applyCep(j.cep)}
      else{
        if(j.street){setStreet(null);setStreetText(j.street)}
        if(j.neighborhood){setNeighborhood(null);setNeighborhoodText(j.neighborhood);await search(j.neighborhood)}
      }
      if(j.number)setNumber(String(j.number));
      if(j.complement)setComplement(String(j.complement));
      setMsg("Endereço lido do comprovante. Confira todos os campos antes de salvar.");
    }catch(err){setMsg(err instanceof Error?err.message:"Não foi possível ler o comprovante.")}
    finally{setReading(false);e.target.value=""}
  }

  function select(s:Result){
    if(s.type==="STREET"){
      setStreet(s);setStreetText(s.name);
      if(s.neighborhoods?.length===1){const n={type:"NEIGHBORHOOD",...s.neighborhoods[0]};setNeighborhood(n);setNeighborhoodText(n.name)}
    }
    if(s.type==="NEIGHBORHOOD"){setNeighborhood(s);setNeighborhoodText(s.name)}
    if(s.type==="RURAL_LOCALITY"){setRural(s);setRuralText(s.name)}
    setSuggestions([]);
  }

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setMsg("");
    const f=new FormData(e.currentTarget);
    if(type==="URBAN"&&cep.replace(/\D/g,"").length!==8)return setMsg("Informe um CEP válido com 8 dígitos.");
    if(type==="URBAN"&&!streetText.trim())return setMsg("Informe a rua.");
    if(type==="URBAN"&&!number.trim())return setMsg("Informe o número. Se o imóvel não tiver número, digite S/N.");
    if(type==="URBAN"&&!neighborhood)return setMsg("Selecione o bairro correspondente na base municipal.");
    const body={
      addressType:type,
      cep:type==="URBAN"?cep:undefined,
      streetId:street?.id||null,
      streetText:type==="URBAN"?streetText.trim():null,
      neighborhoodId:neighborhood?.id||null,
      ruralLocalityId:rural?.id||null,
      number:number||undefined,
      complement:complement||undefined,
      ruralRoad:f.get("ruralRoad")||undefined,
      km:f.get("km")||undefined,
      referencePoint:f.get("referencePoint")||undefined,
      locationPrecision:position?"EXACT":(type==="URBAN"?"APPROXIMATE":"RURAL_LOCALITY"),
      latitude:position?.[0]??null,
      longitude:position?.[1]??null,
      locationSource:position?"USER_PIN":(type==="URBAN"?"CEP":undefined),
      originalInput:type==="URBAN"?`${streetText.trim()} | ${neighborhoodText}`:ruralText
    };
    const r=await fetch("/api/citizen/addresses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok)return setMsg(j.error||"Erro ao salvar endereço.");
    if(j.latitude!=null&&j.longitude!=null)setPosition([Number(j.latitude),Number(j.longitude)]);
    setMsg("Endereço salvo e localizado no mapa.");
    onCreated?.();
  }

  return <form onSubmit={submit} className="form-grid">
    {aiEnabled&&<div className="field full" style={{border:"1px solid #e5e5e5",borderRadius:7,padding:14,background:"#fafafa"}}>
      <label>Preencher pelo comprovante de residência</label>
      <span className="muted">Envie uma foto JPG/PNG. A leitura sugere o endereço; você confere antes de salvar.</span>
      <input type="file" accept="image/jpeg,image/png" onChange={readProof} disabled={reading}/>
      {reading&&<small className="muted">Lendo comprovante…</small>}
    </div>}
    <div className="field full"><label>Tipo de endereço</label><select value={type} onChange={e=>{setType(e.target.value as "URBAN"|"RURAL");setSuggestions([])}}><option value="URBAN">Urbano</option><option value="RURAL">Rural</option></select></div>
    {type==="URBAN"?<>
      <div className="field"><label>CEP</label><input value={cep} onChange={e=>setCep(e.target.value)} placeholder="36570-000"/></div>
      <div className="field" style={{justifyContent:"end"}}><button type="button" className="btn-secondary" onClick={lookup}>Consultar CEP</button></div>
      <div className="field full"><label>Rua</label><input value={streetText} onChange={e=>{setStreet(null);setStreetText(e.target.value);search(e.target.value)}} placeholder="Rua"/></div>
      <div className="field full"><label>Bairro</label><input value={neighborhoodText} onChange={e=>{setNeighborhood(null);setNeighborhoodText(e.target.value);search(e.target.value)}} placeholder="Bairro"/></div>
    </>:<>
      <div className="field full"><label>Localidade / comunidade rural</label><input value={ruralText} onChange={e=>{setRural(null);setRuralText(e.target.value);search(e.target.value)}} placeholder="Comece a digitar a localidade"/></div>
      <div className="field"><label>Estrada</label><input name="ruralRoad"/></div><div className="field"><label>Km / número</label><input name="km"/></div>
    </>}
    {suggestions.length>0&&<div className="field full"><div style={{border:"1px solid #ddd",borderRadius:6,overflow:"hidden"}}>{suggestions.map(s=><button type="button" key={`${s.type}-${s.id}`} onClick={()=>select(s)} style={{display:"block",width:"100%",textAlign:"left",padding:10,border:0,borderBottom:"1px solid #eee",background:"white"}}>{s.name} <small className="muted">{s.type==="STREET"?"Rua":s.type==="NEIGHBORHOOD"?"Bairro":"Localidade"}</small></button>)}</div></div>}
    <div className="field"><label>Número</label><input value={number} onChange={e=>setNumber(e.target.value)}/></div>
    <div className="field"><label>Complemento</label><input value={complement} onChange={e=>setComplement(e.target.value)}/></div>
    <div className="field full"><label>Ponto de referência</label><input name="referencePoint"/></div>
    <div className="field full"><LocationPicker value={position} onChange={setPosition}/></div>
    {msg&&<div className={`alert field full ${msg.startsWith("Endereço salvo")||msg.startsWith("CEP consultado")||msg.startsWith("Endereço lido")?"success":""}`}>{msg}</div>}
    <div className="field full"><button className="btn-primary">Salvar endereço</button></div>
  </form>;
}
