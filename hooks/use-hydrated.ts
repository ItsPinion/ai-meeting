"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;

/**
 * Returns false during SSR and the first client render, then true.
 *
 * The chat data lives in localStorage, which only exists in the browser, so
 * every query is gated on this. It also guarantees the server HTML and the first
 * client render agree, avoiding hydration mismatches.
 *
 * `useSyncExternalStore` is used instead of a `useState` + `useEffect` pair so
 * the flip happens without an extra render pass.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, hydratedSnapshot, serverSnapshot);
}
