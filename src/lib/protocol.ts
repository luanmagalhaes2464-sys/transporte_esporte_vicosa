import { Prisma } from "@prisma/client";

export function formatProtocol(namespace:string,year:number,value:number){return `${namespace}-${year}-${String(value).padStart(6, "0")}`}

export async function nextProtocol(tx: Prisma.TransactionClient, namespace: string, year: number) {
  const counter = await tx.protocolCounter.upsert({
    where: { namespace_year: { namespace, year } },
    update: { value: { increment: 1 } },
    create: { namespace, year, value: 1 }
  });
  return formatProtocol(namespace, year, counter.value);
}
