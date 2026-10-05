import { destroySession } from "@/security/session";

export async function POST() {
  await destroySession();
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Cache-Control": "no-store"
    }
  });
}
