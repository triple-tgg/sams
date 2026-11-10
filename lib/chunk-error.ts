/**
 * Detects errors caused by a stale client bundle trying to load a JS/CSS chunk
 * that no longer exists on the server (typically right after a new deployment).
 * `reset()` cannot recover from this — only a full page reload fetches the new build.
 */
const RELOAD_KEY = "chunk-error-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

export function isChunkLoadError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const { name, message } = error as { name?: string; message?: string };
    if (name === "ChunkLoadError") return true;
    return /Loading (CSS )?chunk [\w-]+ failed|Failed to load chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
        message ?? "",
    );
}

/**
 * Reloads the page once. Returns false if a reload was already attempted within
 * the cooldown window (prevents infinite reload loops if the chunk is truly missing).
 */
export function reloadOnceForChunkError(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
        if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
        // sessionStorage unavailable — still attempt a reload
    }
    window.location.reload();
    return true;
}
