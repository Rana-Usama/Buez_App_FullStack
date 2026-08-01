import { useEffect, useMemo, useRef, useState } from "react";
import {
  FounderBadgeInfo,
  getCachedFounderStatus,
  getFounderStatuses,
} from "../services/FounderStatus.service";

/**
 * Resolves founder status for a list of user ids so surfaces that only hold a
 * denormalized user snapshot (no `isFounder`) can still show the badge.
 *
 * Backed by a shared session cache, so passing the same ids from several
 * screens costs one read per unique user in total. Already-cached ids are
 * returned on the FIRST render (no flash of missing badge on re-visit).
 */
export const useFounderStatuses = (
  userIds: (string | null | undefined)[],
): Record<string, FounderBadgeInfo> => {
  // Stable key so a new array literal each render doesn't re-trigger the fetch.
  const key = useMemo(
    () =>
      Array.from(new Set(userIds.filter((id): id is string => !!id)))
        .sort()
        .join(","),
    [userIds],
  );

  const [statuses, setStatuses] = useState<Record<string, FounderBadgeInfo>>(
    () => {
      const seeded: Record<string, FounderBadgeInfo> = {};
      userIds.forEach((id) => {
        const cached = getCachedFounderStatus(id);
        if (id && cached) seeded[id] = cached;
      });
      return seeded;
    },
  );

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!key) return;
    const ids = key.split(",");

    // Serve straight from cache when everything is already known.
    const cached: Record<string, FounderBadgeInfo> = {};
    let allCached = true;
    for (const id of ids) {
      const hit = getCachedFounderStatus(id);
      if (hit) cached[id] = hit;
      else allCached = false;
    }
    if (allCached) {
      setStatuses(cached);
      return;
    }

    let cancelled = false;
    (async () => {
      const resolved = await getFounderStatuses(ids);
      if (!cancelled && mounted.current) setStatuses(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [key]);

  return statuses;
};

/** Single-user convenience wrapper around {@link useFounderStatuses}. */
export const useFounderStatus = (
  userId?: string | null,
): FounderBadgeInfo | undefined => {
  const ids = useMemo(() => [userId], [userId]);
  const statuses = useFounderStatuses(ids);
  return userId ? statuses[userId] : undefined;
};
