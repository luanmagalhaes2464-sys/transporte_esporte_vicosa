import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const settings = await prisma.systemSetting.findMany({ where: { public: true } });
  return NextResponse.json(Object.fromEntries(settings.map(x => [x.key, x.value])));
}
