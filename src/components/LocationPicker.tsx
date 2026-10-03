"use client";
import dynamic from "next/dynamic";
const MapInner=dynamic(()=>import('./MapInner'),{ssr:false,loading:()=> <div style={{padding:20}}>Carregando mapa…</div>});
export function LocationPicker({value,onChange}:{value?:[number,number];onChange:(p:[number,number])=>void}){return <div><p style={{fontWeight:700,marginBottom:8}}>Confirme onde o aluno mora.</p><p className="muted" style={{fontSize:14}}>Toque no mapa ou mova o marcador. Não é necessário informar latitude e longitude.</p><div className="map-box"><MapInner value={value} onChange={onChange}/></div></div>}
