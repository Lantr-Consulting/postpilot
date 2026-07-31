"use client";

// One /health ping per page load, shared: is the brain reachable?

import { useEffect, useState } from "react";
import { health } from "./api";

let cached: boolean | null = null;

export function useLive(): { live: boolean; checking: boolean } {
  const [state, setState] = useState<{ live: boolean; checking: boolean }>(
    cached === null ? { live: false, checking: true } : { live: cached, checking: false }
  );

  useEffect(() => {
    if (cached !== null) return;
    let alive = true;
    health()
      .then((h) => {
        cached = h.ok && h.llm;
      })
      .catch(() => {
        cached = false;
      })
      .finally(() => {
        if (alive) setState({ live: cached === true, checking: false });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
