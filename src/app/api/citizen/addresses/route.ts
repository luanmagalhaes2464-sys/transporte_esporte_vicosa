import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/security/authorization";
import { digitsOnly } from "@/lib/normalize";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";
import { geocode } from "@/providers/geocoding";
import { env } from "@/config/env";

const schema = z.object({
  addressType:z.enum(["URBAN","RURAL"]),
  streetId:z.string().uuid().nullable().optional(),
  streetText:z.string().trim().max(220).nullable().optional(),
  neighborhoodId:z.string().uuid().nullable().optional(),
  districtId:z.string().uuid().nullable().optional(),
  ruralLocalityId:z.string().uuid().nullable().optional(),
  cep:z.string().optional().transform(v=>v?digitsOnly(v):undefined),
  number:z.string().max(30).optional(),
  complement:z.string().max(160).optional(),
  ruralRoad:z.string().max(180).optional(),
  km:z.string().max(30).optional(),
  referencePoint:z.string().max(240).optional(),
  latitude:z.number().min(-90).max(90).nullable().optional(),
  longitude:z.number().min(-180).max(180).nullable().optional(),
  locationSource:z.enum(["CEP","GEOCODE","USER_PIN","ADMIN","IMPORT"]).optional(),
  locationPrecision:z.enum(["EXACT","APPROXIMATE","NEIGHBORHOOD","RURAL_LOCALITY"]).optional(),
  originalInput:z.string().max(500).optional()
});

export async function GET(){
  try {
    const u=await requireUser();
    const row=await prisma.address.findFirst({
      where:{personId:u.personId,active:true},
      include:{street:true,neighborhood:true,district:true,ruralLocality:true},
      orderBy:[{updatedAt:"desc"},{createdAt:"desc"}]
    });
    return NextResponse.json(row ? [row] : []);
  } catch(e){return handleRouteError(e)}
}

export async function POST(req:NextRequest){
  try{
    const u=await requireUser();
    const v=schema.parse(await req.json());
    const setting=await prisma.systemSetting.findUniqueOrThrow({where:{key:"default_municipality_id"}});
    const municipalityId=setting.value;
    if(v.addressType==="URBAN"&&!v.neighborhoodId)throw new Error("NEIGHBORHOOD_REQUIRED");
    if(v.addressType==="URBAN"&&!v.streetId&&!v.streetText)throw new Error("STREET_REQUIRED");
    if(v.addressType==="RURAL"&&!v.ruralLocalityId)throw new Error("RURAL_LOCALITY_REQUIRED");

    const [neighborhood,street,district,rural]=await Promise.all([
      v.neighborhoodId?prisma.neighborhood.findFirst({where:{id:v.neighborhoodId,municipalityId,active:true},select:{id:true,name:true}}):null,
      v.streetId?prisma.street.findFirst({where:{id:v.streetId,municipalityId,active:true},include:{neighborhoods:true}}):null,
      v.districtId?prisma.district.findFirst({where:{id:v.districtId,municipalityId,active:true},select:{id:true}}):null,
      v.ruralLocalityId?prisma.ruralLocality.findFirst({where:{id:v.ruralLocalityId,municipalityId,active:true},select:{id:true,districtId:true}}):null
    ]);
    if((v.neighborhoodId&&!neighborhood)||(v.streetId&&!street)||(v.districtId&&!district)||(v.ruralLocalityId&&!rural))throw new Error("TERRITORY_REFERENCE_INVALID");
    if(street&&v.neighborhoodId&&street.neighborhoods.length>0&&!street.neighborhoods.some(x=>x.neighborhoodId===v.neighborhoodId))throw new Error("TERRITORY_REFERENCE_INVALID");
    if(rural?.districtId&&v.districtId&&rural.districtId!==v.districtId)throw new Error("TERRITORY_REFERENCE_INVALID");

    let latitude=v.latitude??null;
    let longitude=v.longitude??null;
    let locationSource=v.locationSource;
    let locationPrecision=v.locationPrecision;

    if(v.addressType==="URBAN"&&(latitude==null||longitude==null)){
      const streetName=street?.name||v.streetText||"";
      const query=[streetName,v.number,neighborhood?.name,v.cep,env().MUNICIPALITY_NAME,env().MUNICIPALITY_STATE,"Brasil"].filter(Boolean).join(", ");
      if(streetName&&query.length>=3){
        try{
          const results=await geocode(query);
          const first=results[0];
          if(first){
            latitude=first.latitude;
            longitude=first.longitude;
            locationSource="GEOCODE";
            locationPrecision="APPROXIMATE";
          }
        }catch{}
      }
    }

    const streetText=v.addressType==="URBAN"?(street?.name||v.streetText||null):null;

    const row=await prisma.$transaction(async tx=>{
      await tx.address.updateMany({where:{personId:u.personId,active:true},data:{active:false}});
      return tx.address.create({data:{
        personId:u.personId,municipalityId,
        addressType:v.addressType,
        streetId:v.streetId,
        streetText,
        neighborhoodId:v.neighborhoodId,
        districtId:v.districtId,
        ruralLocalityId:v.ruralLocalityId,
        cep:v.cep,
        number:v.number,
        complement:v.complement,
        ruralRoad:v.ruralRoad,
        km:v.km,
        referencePoint:v.referencePoint,
        latitude,
        longitude,
        locationSource,
        locationPrecision,
        originalInput:v.originalInput,
        verified:false,
        active:true
      }});
    });

    await audit({actorUserId:u.id,action:"UPDATE",entityType:"residential_address",entityId:row.id,changedFields:["addressType","streetId","streetText","neighborhoodId","districtId","ruralLocalityId","latitude","longitude","locationPrecision"]});
    return NextResponse.json(row,{status:201});
  }catch(e){return handleRouteError(e)}
}
