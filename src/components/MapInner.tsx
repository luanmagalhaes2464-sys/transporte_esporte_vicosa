"use client";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
const icon = L.divIcon({ className:"", html:'<div style="width:22px;height:22px;background:#B51F2A;border:3px solid white;border-radius:50%;box-shadow:0 1px 4px #0007"></div>', iconSize:[22,22], iconAnchor:[11,11] });
function Clicker({position,onChange}:{position:[number,number];onChange:(p:[number,number])=>void}){useMapEvents({click:e=>onChange([e.latlng.lat,e.latlng.lng])});return <Marker position={position} icon={icon} draggable eventHandlers={{dragend:e=>{const p=(e.target as L.Marker).getLatLng();onChange([p.lat,p.lng])}}}/>}
export default function MapInner({value,onChange}:{value?:[number,number];onChange:(p:[number,number])=>void}){const position=value??[-20.7539,-42.8816];return <MapContainer center={position} zoom={13} style={{height:'100%',width:'100%'}}><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Clicker position={position} onChange={onChange}/></MapContainer>}
