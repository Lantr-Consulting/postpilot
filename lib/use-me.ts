"use client";

// The signed-in creator, or null. One fetch per page load, shared.

import { useCallback, useEffect, useState } from "react";
import { getMe, isSignedOut, type Me } from "./api";

let cached: Me | null | undefined;

export function useMe(): {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [me, setMe] = useState<Me | null>(cached ?? null);
  const [loading, setLoading] = useState(cached === undefined);

  const refresh = useCallback(async () => {
    try {
      cached = await getMe();
    } catch (e) {
      cached = null;
      if (!isSignedOut(e)) {
        // backend down: same as signed out for the UI — mocks stand in
      }
    }
    setMe(cached);
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(id);
  }, [refresh]);

  return { me, loading, refresh };
}
