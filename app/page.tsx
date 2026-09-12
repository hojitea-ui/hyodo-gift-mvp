"use client";

import { useState, useSyncExternalStore } from "react";
import UploadPanel from "@/components/UploadPanel";
import DashboardView from "@/components/dashboard/DashboardView";
import {
  clearProducts,
  getProductsSnapshot,
  getServerProductsSnapshot,
  loadProducts,
  saveProducts,
  subscribeProducts,
} from "@/lib/storage";
import type { Product } from "@/lib/schema";

export default function Home() {
  const storedProducts = useSyncExternalStore(subscribeProducts, getProductsSnapshot, getServerProductsSnapshot);
  const [viewOverride, setViewOverride] = useState<"upload" | "dashboard" | null>(null);
  const view = viewOverride ?? (storedProducts.length > 0 ? "dashboard" : "upload");

  function handleConfirm(newProducts: Product[], mode: "overwrite" | "append") {
    const merged = mode === "append" ? [...loadProducts(), ...newProducts] : newProducts;
    saveProducts(merged);
    setViewOverride("dashboard");
  }

  function handleReset() {
    clearProducts();
    setViewOverride("upload");
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <header className="mb-10 flex w-full max-w-3xl items-center justify-between">
        <h1 className="text-xl font-semibold">용돈박스+결합상품 경쟁 상품 분석</h1>
        {view === "dashboard" && (
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setViewOverride("upload")}
              className="rounded-full border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              새 파일 업로드
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              데이터 초기화
            </button>
          </div>
        )}
      </header>

      {view === "upload" ? (
        <UploadPanel hasExistingData={storedProducts.length > 0} onConfirm={handleConfirm} />
      ) : (
        <DashboardView products={storedProducts} />
      )}
    </div>
  );
}
