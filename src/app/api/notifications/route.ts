import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { handler, ok } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const session = await requireUser();
  const repo = await getRepository();
  const notifications = await repo.listNotifications(session.id);
  return ok({ notifications, unread: notifications.filter((n) => !n.read).length });
});

export const PATCH = handler(async (request: Request) => {
  const session = await requireUser();
  const { id } = z.object({ id: z.string().min(1) }).parse(await request.json().catch(() => ({})));
  const repo = await getRepository();
  await repo.markNotificationRead(session.id, id);
  return ok({ updated: true });
});
