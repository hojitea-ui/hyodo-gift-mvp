import { beforeEach, describe, expect, it } from "vitest";
import { clearProducts, hasStoredProducts, loadProducts, saveProducts } from "./storage";
import type { Product } from "./schema";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

const sampleProducts: Product[] = [
  {
    name: "프리미엄 용돈박스+옥지압봉",
    platform: "네이버",
    price: 15000,
    boxType: "봉투형",
    combinationType: "지압봉",
  },
];

beforeEach(() => {
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: createMemoryStorage() },
    writable: true,
    configurable: true,
  });
});

describe("storage", () => {
  it("returns an empty array when nothing is stored", () => {
    expect(loadProducts()).toEqual([]);
    expect(hasStoredProducts()).toBe(false);
  });

  it("round-trips products through save/load", () => {
    saveProducts(sampleProducts);
    expect(loadProducts()).toEqual(sampleProducts);
    expect(hasStoredProducts()).toBe(true);
  });

  it("clears stored products", () => {
    saveProducts(sampleProducts);
    clearProducts();
    expect(loadProducts()).toEqual([]);
  });

  it("falls back to an empty array on corrupted JSON", () => {
    window.localStorage.setItem("hyodo-gift-mvp:products", "{not valid json");
    expect(loadProducts()).toEqual([]);
  });
});
