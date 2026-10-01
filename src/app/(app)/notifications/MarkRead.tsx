"use client";

import { useEffect } from "react";
import { markAllNotificationsRead } from "./actions";

/** Opening the notifications page counts as reading them. */
export function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (hasUnread) markAllNotificationsRead();
  }, [hasUnread]);
  return null;
}
