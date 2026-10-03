import { NextRequest,NextResponse } from "next/server";
import { requireUser } from "@/security/authorization";
import { extractAddressFromImage } from "@/providers/document-ai";
import { handleRouteError,jsonError } from "@/lib/http";

export async function POST(req:NextRequest){
  try{
    await requireUser();
    const form=await req.formData();
    const file=form.get("file");
    if(!(file instanceof File))return jsonError("Selecione uma imagem do comprovante.",422);
    if(file.type!=="image/jpeg"&&file.type!=="image/png")return jsonError("A leitura automática aceita JPG ou PNG. PDFs continuam disponíveis para o upload de documentos.",422);
    if(file.size<=0||file.size>8_000_000)return jsonError("A imagem deve ter no máximo 8 MB.",422);
    const result=await extractAddressFromImage({bytes:Buffer.from(await file.arrayBuffer()),mimeType:file.type as "image/jpeg"|"image/png"});
    return NextResponse.json(result);
  }catch(e){
    if(e instanceof Error&&e.message==="DOCUMENT_AI_NOT_CONFIGURED")return jsonError("Leitura automática ainda não está habilitada.",503);
    if(e instanceof Error&&(e.message==="DOCUMENT_AI_PROVIDER_ERROR"||e.message==="DOCUMENT_AI_INVALID_RESPONSE"))return jsonError("Não foi possível ler o comprovante automaticamente. Preencha o endereço manualmente.",502);
    return handleRouteError(e);
  }
}
