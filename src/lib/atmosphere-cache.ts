/**
 * Client-only cache for Imagine comic atmosphere art.
 * Keyed by location so replaying missions at the same place reuses art
 * (no second image call / budget hit).
 *
 * Memory first; sessionStorage best-effort (quota may reject large data URLs).
 */

const PREFIX = "bubblecast-atm-v1:";

const memory = new Map<string, string>();

function storageKey(locationId: string) {
  return `${PREFIX}${locationId}`;
}

export function getCachedAtmosphere(locationId: string): string | null {
  const mem = memory.get(locationId);
  if (mem) return mem;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(locationId));
    if (raw && raw.startsWith("data:")) {
      memory.set(locationId, raw);
      return raw;
    }
  } catch {
    /* private mode / quota */
  }
  return null;
}

export function setCachedAtmosphere(locationId: string, dataUrl: string): void {
  if (!dataUrl.startsWith("data:")) return;
  memory.set(locationId, dataUrl);
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(locationId), dataUrl);
  } catch {
    // QuotaExceeded — keep memory hit for this tab only
  }
}

export function clearCachedAtmosphere(locationId?: string): void {
  if (locationId) {
    memory.delete(locationId);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(storageKey(locationId));
      } catch {
        /* ignore */
      }
    }
    return;
  }
  memory.clear();
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

/** Whether a cache entry exists (for UI / skip-Imagine decisions). */
export function hasCachedAtmosphere(locationId: string): boolean {
  return getCachedAtmosphere(locationId) !== null;
}
