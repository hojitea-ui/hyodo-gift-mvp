import type { Product } from "./schema";

const STORAGE_KEY = "hyodo-gift-mvp:products";
const EMPTY_PRODUCTS: Product[] = [];

function getLocalStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

function parseStored(raw: string | null): Product[] {
  if (!raw) return EMPTY_PRODUCTS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : EMPTY_PRODUCTS;
  } catch {
    return EMPTY_PRODUCTS;
  }
}

// Cached so repeated reads (e.g. useSyncExternalStore's getSnapshot, called on
// every render) return a referentially stable array when localStorage hasn't changed.
let cacheValid = false;
let cachedRaw: string | null = null;
let cachedSnapshot: Product[] = EMPTY_PRODUCTS;

function readSnapshot(): Product[] {
  const raw = getLocalStorage()?.getItem(STORAGE_KEY) ?? null;
  if (!cacheValid || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = parseStored(raw);
    cacheValid = true;
  }
  return cachedSnapshot;
}

function invalidateCache(): void {
  cacheValid = false;
}

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function loadProducts(): Product[] {
  return readSnapshot();
}

export function saveProducts(products: Product[]): void {
  getLocalStorage()?.setItem(STORAGE_KEY, JSON.stringify(products));
  invalidateCache();
  notify();
}

export function clearProducts(): void {
  getLocalStorage()?.removeItem(STORAGE_KEY);
  invalidateCache();
  notify();
}

export function hasStoredProducts(): boolean {
  return loadProducts().length > 0;
}

// --- useSyncExternalStore support (localStorage as an external store) ---

export const getProductsSnapshot = loadProducts;

export function getServerProductsSnapshot(): Product[] {
  return EMPTY_PRODUCTS;
}

export function subscribeProducts(callback: () => void): () => void {
  listeners.add(callback);

  const storage = getLocalStorage();
  if (!storage) return () => listeners.delete(callback);

  function handleStorageEvent(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      invalidateCache();
      callback();
    }
  }

  window.addEventListener("storage", handleStorageEvent);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorageEvent);
  };
}
