import { NextRequest,NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireUser } from "@/security/authorization";
import { storageProvider } from "@/providers/storage";
import { handleRouteError,jsonError } from "@/lib/http";
const schema=z.object({filename:z.string().min(1).max(200),mimeType:z.enum(["application/pdf","image/jpeg","image/png"]),sizeBytes:z.number().int().positive().max(10_000_000)});
export async function POST(req:NextRequest){try{const u=await requireUser();const v=schema.parse(await req.json());const safe=v.filename.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100);const key=`documents/${u.id}/${new Date().getUTCFullYear()}/${randomUUID()}-${safe}`;const target=await storageProvider().createUploadTarget(key,v.mimeType);return NextResponse.json({key,...target})}catch(e){if(e instanceof Error&&e.message.includes('STORAGE_'))return jsonError('Armazenamento de documentos ainda não foi configurado.',503);return handleRouteError(e)}}
