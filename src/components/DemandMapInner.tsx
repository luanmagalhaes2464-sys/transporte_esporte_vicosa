"use client";
import { MapContainer,TileLayer,Marker,Popup } from "react-leaflet";
import L from "leaflet";
type P={id:string;lat:number;lng:number;label:string;school?:string;address?:string};

export default function DemandMapInner({points}:{points:P[]}){
  const groups=new Map<string,P[]>();
  for(const p of points){
    const key=`${Math.round(p.lat/0.0015)}:${Math.round(p.lng/0.0015)}`;
    (groups.get(key)??groups.set(key,[]).get(key)!).push(p);
  }
  const clusters=[...groups.values()];
  const center:[number,number]=points.length
    ? [points.reduce((s,p)=>s+p.lat,0)/points.length,points.reduce((s,p)=>s+p.lng,0)/points.length]
    : [-20.7539,-42.8816];

  return <MapContainer center={center} zoom={points.length?15:13} style={{height:"100%",width:"100%"}}>
    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
    {clusters.map((g,i)=>{
      const lat=g.reduce((s,p)=>s+p.lat,0)/g.length;
      const lng=g.reduce((s,p)=>s+p.lng,0)/g.length;
      const icon=L.divIcon({
        className:"",
        html:g.length>1
          ? `<div style="width:34px;height:34px;border-radius:50%;background:#B51F2A;color:white;border:3px solid white;display:grid;place-items:center;font-weight:800;box-shadow:0 1px 6px #0005">${g.length}</div>`
          : '<div style="width:20px;height:20px;border-radius:50%;background:#B51F2A;border:3px solid white;box-shadow:0 1px 5px #0005"></div>',
        iconSize:g.length>1?[34,34]:[20,20],
        iconAnchor:g.length>1?[17,17]:[10,10]
      });
      return <Marker key={i} position={[lat,lng]} icon={icon}><Popup>
        {g.length>1
          ? <><strong>{g.length} solicitações nesta área</strong>{g.slice(0,8).map(x=><div key={x.id} style={{marginTop:6}}>{x.label}{x.address?<><br/><small>{x.address}</small></>:null}</div>)}</>
          : <><strong>{g[0].label}</strong>{g[0].address?<><br/>{g[0].address}</>:null}{g[0].school?<><br/><small>{g[0].school}</small></>:null}</>}
      </Popup></Marker>;
    })}
  </MapContainer>;
}
