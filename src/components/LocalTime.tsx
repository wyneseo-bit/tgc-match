"use client";

import { useSyncExternalStore } from "react";

const FORMATS = {
  datetime: { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" },
  date: { day: "numeric", month: "long", year: "numeric" },
  short: { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

const noopSubscribe = () => () => {};

/**
 * A timestamp in the viewer's own timezone and locale. The server's timezone
 * (UTC in production) isn't the viewer's, so the server renders a plain
 * date and the client swaps in the local time once mounted.
 */
export function LocalTime({ iso, format = "datetime" }: { iso: string; format?: keyof typeof FORMATS }) {
  const onClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <time dateTime={iso}>
      {onClient ? new Date(iso).toLocaleString(undefined, FORMATS[format]) : iso.slice(0, 10)}
    </time>
  );
}
