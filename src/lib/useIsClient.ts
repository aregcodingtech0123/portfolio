import { useSyncExternalStore } from "react";

function subscribe() {
  // No external store to subscribe to: whether hydration has completed
  // never changes again after the first client render, so there is nothing
  // to listen for.
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * True once mounted on the client; false during SSR and the first
 * hydration pass. Replaces the `useState(false)` + `useEffect(() =>
 * setState(true), [])` pattern used to gate client-only work (e.g. a
 * `createPortal` call, which needs `document.body`). That pattern sets
 * state synchronously inside an effect for a value that isn't really
 * external state, it is "has React finished hydrating" -- exactly what
 * useSyncExternalStore reports without an extra render-triggering effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
