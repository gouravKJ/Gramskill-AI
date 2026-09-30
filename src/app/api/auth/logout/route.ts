import { clearSessionCookie } from "@/lib/auth/session";
import { handler, ok } from "@/lib/api/http";

export const POST = handler(async () => {
  await clearSessionCookie();
  return ok({ signedOut: true });
});
