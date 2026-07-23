/**
 * Client-only cache for Imagine cast portraits.
 * Memory + sessionStorage (quota may reject large data URLs).
 */

const PREFIX = "bubblecast-portrait-v1:";

const memory = new Map<string, string>();

function storageKey(characterId: string) {
  return `${PREFIX}${characterId}`;
}

export function getCachedPortrait(characterId: string): string | null {
  const mem = memory.get(characterId);
  if (mem) return mem;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(characterId));
    if (raw && raw.startsWith("data:")) {
      memory.set(characterId, raw);
      return raw;
    }
  } catch {
    /* private mode */
  }
  return null;
}

export function setCachedPortrait(characterId: string, dataUrl: string): void {
  if (!dataUrl.startsWith("data:")) return;
  memory.set(characterId, dataUrl);
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(characterId), dataUrl);
  } catch {
    /* quota — memory only */
  }
}

export function clearCachedPortraits(characterId?: string): void {
  if (characterId) {
    memory.delete(characterId);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(storageKey(characterId));
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

export function countCachedPortraits(characterIds: string[]): number {
  return characterIds.filter((id) => getCachedPortrait(id)).length;
}
