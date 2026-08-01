"use client";

// Live workspace when the backend is reachable; null when it isn't — the
// caller falls back to the Milestone-1 mock data.

import { useCallback, useEffect, useState } from "react";
import { getWorkspace, type Workspace } from "./api";

export function useWorkspace(): {
  ws: Workspace | null;
  live: boolean;
  refresh: () => Promise<void>;
} {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [live, setLive] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setWs(await getWorkspace());
      setLive(true);
    } catch {
      setWs(null);
      setLive(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(id);
  }, [refresh]);

  return { ws, live, refresh };
}
