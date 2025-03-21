"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the component is mounted client-side
 * Useful for components that use browser APIs and need to avoid hydration mismatches
 */
export function useClientMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
