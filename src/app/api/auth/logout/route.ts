import { NextResponse } from "next/server";
import { destroySession } from "@/security/session";
import { env } from "@/config/env";

export async function POST() {
  await destroySession();
  return NextResponse.redirect(new URL("/", env().APP_URL), 303);
}
