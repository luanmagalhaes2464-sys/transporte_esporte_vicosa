import { prisma } from "@/lib/prisma";
export type PortalSettings={portalName:string;portalSubtitle:string;municipalityName:string;primaryColor:string};
export async function getPortalSettings():Promise<PortalSettings>{
  const defaults={portalName:'Portal Viçosa',portalSubtitle:'Educação, Transporte e Esporte',municipalityName:'Prefeitura de Viçosa',primaryColor:'#B51F2A'};
  try{const rows=await prisma.systemSetting.findMany({where:{key:{in:['portal_name','portal_subtitle','municipality_name','primary_color']}}});const m=Object.fromEntries(rows.map(r=>[r.key,r.value]));return{portalName:m.portal_name||defaults.portalName,portalSubtitle:m.portal_subtitle||defaults.portalSubtitle,municipalityName:m.municipality_name||defaults.municipalityName,primaryColor:m.primary_color||defaults.primaryColor}}catch{return defaults}
}
