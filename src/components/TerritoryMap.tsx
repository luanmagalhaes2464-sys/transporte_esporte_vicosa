"use client";
import dynamic from "next/dynamic";
const Inner=dynamic(()=>import("./TerritoryMapInner"),{ssr:false,loading:()=> <div style={{padding:20}}>Carregando mapa territorial…</div>});
export function TerritoryMap({points}:{points:{id:string;lat:number;lng:number;label:string;kind:string}[]}){return <div className="map-box"><Inner points={points}/></div>}
