/** localStorage key for the whole chat store. */
export const STORAGE_KEY = "ai-meeting:chat";

/**
 * Bump when the persisted shape changes. A mismatch wipes the store and
 * re-seeds it, so a stale payload can never crash the app.
 */
export const STORE_VERSION = 1;
