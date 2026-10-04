"use client";
import dynamic from "next/dynamic";
const Inner=dynamic(()=>import("./DemandMapInner"),{ssr:false,loading:()=> <div style={{padding:20}}>Carregando mapa da demanda…</div>});
export function DemandMap({points}:{points:{id:string;lat:number;lng:number;label:string;school?:string;address?:string}[]}){return <div className="map-box"><Inner points={points}/></div>}
