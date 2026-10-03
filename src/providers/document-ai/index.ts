import { env } from "@/config/env";

export type ExtractedAddress = {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  confidence?: number;
};

function outputText(data:any){
  if(typeof data?.output_text==="string")return data.output_text;
  const parts=(data?.output||[]).flatMap((o:any)=>o?.content||[]);
  return parts.filter((p:any)=>p?.type==="output_text"&&typeof p.text==="string").map((p:any)=>p.text).join("\n");
}

function parseJson(text:string):ExtractedAddress{
  const clean=text.trim().replace(/^\`\`\`(?:json)?/i,"").replace(/\`\`\`$/,"").trim();
  const match=clean.match(/\{[\s\S]*\}/);
  if(!match)throw new Error("DOCUMENT_AI_INVALID_RESPONSE");
  const value=JSON.parse(match[0]);
  return {
    cep: typeof value.cep==="string"?value.cep.replace(/\D/g,""):undefined,
    street: typeof value.street==="string"?value.street.trim():undefined,
    number: typeof value.number==="string"||typeof value.number==="number"?String(value.number):undefined,
    complement: typeof value.complement==="string"?value.complement.trim():undefined,
    neighborhood: typeof value.neighborhood==="string"?value.neighborhood.trim():undefined,
    city: typeof value.city==="string"?value.city.trim():undefined,
    state: typeof value.state==="string"?value.state.trim().toUpperCase():undefined,
    confidence: typeof value.confidence==="number"?Math.max(0,Math.min(1,value.confidence)):undefined
  };
}

export function documentAiEnabled(){
  const e=env();
  return e.DOCUMENT_AI_PROVIDER==="neon"&&Boolean(e.NEON_AI_GATEWAY_BASE_URL&&e.NEON_AI_GATEWAY_TOKEN);
}

export async function extractAddressFromImage(input:{bytes:Buffer;mimeType:"image/jpeg"|"image/png"}):Promise<ExtractedAddress>{
  const e=env();
  if(!documentAiEnabled())throw new Error("DOCUMENT_AI_NOT_CONFIGURED");
  const base=e.NEON_AI_GATEWAY_BASE_URL!.replace(/\/$/,"");
  const image=`data:${input.mimeType};base64,${input.bytes.toString("base64")}`;
  const response=await fetch(`${base}/openai/v1/responses`,{
    method:"POST",
    headers:{Authorization:`Bearer ${e.NEON_AI_GATEWAY_TOKEN}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      model:e.DOCUMENT_AI_MODEL,
      input:[{
        role:"user",
        content:[
          {type:"input_text",text:"Leia este comprovante de residência brasileiro e extraia somente o endereço residencial. Retorne APENAS JSON válido com as chaves cep, street, number, complement, neighborhood, city, state, confidence. Use null quando não conseguir ler um campo. confidence deve ser número de 0 a 1. Não invente dados."},
          {type:"input_image",image_url:image}
        ]
      }]
    })
  });
  if(!response.ok)throw new Error("DOCUMENT_AI_PROVIDER_ERROR");
  return parseJson(outputText(await response.json()));
}
