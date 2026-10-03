import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env";

const COOKIE = "pv_session";

function secret() { return new TextEncoder().encode(env().AUTH_SECRET); }

export type SessionPayload = { userId: string; email: string };

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${env().SESSION_MAX_AGE_HOURS}h`)
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: env().APP_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: env().SESSION_MAX_AGE_HOURS * 3600
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: String(payload.userId), email: String(payload.email) };
  } catch { return null; }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}
