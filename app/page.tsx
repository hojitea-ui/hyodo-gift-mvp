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
    <div className="flex flex-1 flex-col items-center bg-canvas px-6 py-14">
      <header className="mb-10 flex w-full max-w-5xl items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">용돈박스 시장 조사</p>
          <h1 className="mt-1 font-display text-3xl text-ink">용돈박스+결합상품 경쟁 분석</h1>
        </div>
        {view === "dashboard" && (
          <div className="flex shrink-0 gap-2 text-sm">
            <button
              type="button"
              onClick={() => setViewOverride("upload")}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-ink transition-colors hover:border-accent"
            >
              새 파일 업로드
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-ink-muted transition-colors hover:border-danger hover:text-danger"
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
