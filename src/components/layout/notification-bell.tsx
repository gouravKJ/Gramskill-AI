"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CalendarClock, FileText, GraduationCap, Info, Briefcase } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { Notification } from "@/types";

const KIND_ICON = {
  JOB: Briefcase,
  APPLICATION: FileText,
  TRAINING: GraduationCap,
  SYSTEM: Info,
  DEADLINE: CalendarClock,
};

export function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = React.useState(notifications);
  const unread = items.filter((n) => !n.read).length;

  async function markRead(id: string) {
    setItems((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => undefined);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Notifications (${unread} unread)`}>
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span>Notifications</span>
          {unread > 0 && <span className="text-[10px] font-normal">{unread} unread</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {items.slice(0, 8).map((item) => {
              const Icon = KIND_ICON[item.kind] ?? Info;
              return (
                <li key={item.id}>
                  <DropdownMenuItem
                    asChild
                    className="items-start gap-3 rounded-none px-4 py-3"
                    onSelect={() => markRead(item.id)}
                  >
                    <Link href={item.href ?? "/dashboard"}>
                      <span
                        className={cn(
                          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg",
                          item.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("text-sm", !item.read && "font-semibold")}>{item.title}</span>
                          {!item.read && <span className="size-1.5 rounded-full bg-primary" />}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{item.body}</span>
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          {formatDate(item.createdAt, true)}
                        </span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
