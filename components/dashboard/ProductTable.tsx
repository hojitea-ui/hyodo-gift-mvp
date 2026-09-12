"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/schema";

type SortKey = "price" | "reviewCount" | "rating";
type SortDirection = "asc" | "desc";

interface ProductTableProps {
  products: Product[];
}

const ALL = "all";

interface SortableHeaderProps {
  sortableKey: SortKey;
  label: string;
  sortKey: SortKey | null;
  sortDirection: SortDirection;
  onToggle: (key: SortKey) => void;
}

function SortableHeader({ sortableKey, label, sortKey, sortDirection, onToggle }: SortableHeaderProps) {
  const active = sortKey === sortableKey;
  return (
    <button type="button" onClick={() => onToggle(sortableKey)} className="flex items-center gap-1 font-medium">
      {label}
      {active && <span>{sortDirection === "asc" ? "▲" : "▼"}</span>}
    </button>
  );
}

export default function ProductTable({ products }: ProductTableProps) {
  const [platformFilter, setPlatformFilter] = useState(ALL);
  const [boxTypeFilter, setBoxTypeFilter] = useState(ALL);
  const [combinationTypeFilter, setCombinationTypeFilter] = useState(ALL);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const platforms = useMemo(() => Array.from(new Set(products.map((p) => p.platform))).sort(), [products]);
  const boxTypes = useMemo(() => Array.from(new Set(products.map((p) => p.boxType))).sort(), [products]);
  const combinationTypes = useMemo(
    () => Array.from(new Set(products.map((p) => p.combinationType))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const min = minPrice === "" ? -Infinity : Number(minPrice);
    const max = maxPrice === "" ? Infinity : Number(maxPrice);
    return products.filter((p) => {
      if (platformFilter !== ALL && p.platform !== platformFilter) return false;
      if (boxTypeFilter !== ALL && p.boxType !== boxTypeFilter) return false;
      if (combinationTypeFilter !== ALL && p.combinationType !== combinationTypeFilter) return false;
      if (p.price < min || p.price > max) return false;
      return true;
    });
  }, [products, platformFilter, boxTypeFilter, combinationTypeFilter, minPrice, maxPrice]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const withValue = filtered.map((p) => ({ product: p, value: p[sortKey] }));
    withValue.sort((a, b) => {
      const av = a.value ?? -Infinity;
      const bv = b.value ?? -Infinity;
      return sortDirection === "asc" ? av - bv : bv - av;
    });
    return withValue.map((w) => w.product);
  }, [filtered, sortKey, sortDirection]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const selectClass = "rounded-md border border-border bg-canvas px-2 py-1";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
        <label className="flex flex-col gap-1 text-ink-muted">
          판매처
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className={selectClass}>
            <option value={ALL}>전체</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-ink-muted">
          용돈박스형태
          <select value={boxTypeFilter} onChange={(e) => setBoxTypeFilter(e.target.value)} className={selectClass}>
            <option value={ALL}>전체</option>
            {boxTypes.map((boxType) => (
              <option key={boxType} value={boxType}>
                {boxType}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-ink-muted">
          결합상품유형
          <select
            value={combinationTypeFilter}
            onChange={(e) => setCombinationTypeFilter(e.target.value)}
            className={selectClass}
          >
            <option value={ALL}>전체</option>
            {combinationTypes.map((combinationType) => (
              <option key={combinationType} value={combinationType}>
                {combinationType}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-ink-muted">
          최소가격
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="0"
            className="w-24 rounded-md border border-border bg-canvas px-2 py-1 text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-ink-muted">
          최대가격
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="제한 없음"
            className="w-24 rounded-md border border-border bg-canvas px-2 py-1 text-ink"
          />
        </label>
        <span className="tabular ml-auto text-ink-muted">
          {sorted.length} / {products.length}건 표시
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-3 py-2 font-medium">상품명</th>
              <th className="px-3 py-2 font-medium">판매처</th>
              <th className="px-3 py-2">
                <SortableHeader
                  sortableKey="price"
                  label="가격"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onToggle={toggleSort}
                />
              </th>
              <th className="px-3 py-2 font-medium">용돈박스형태</th>
              <th className="px-3 py-2 font-medium">결합상품유형</th>
              <th className="px-3 py-2 font-medium">구성</th>
              <th className="px-3 py-2 font-medium">재질</th>
              <th className="px-3 py-2">
                <SortableHeader
                  sortableKey="reviewCount"
                  label="리뷰수"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onToggle={toggleSort}
                />
              </th>
              <th className="px-3 py-2">
                <SortableHeader
                  sortableKey="rating"
                  label="평점"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onToggle={toggleSort}
                />
              </th>
              <th className="px-3 py-2 font-medium">URL</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product, index) => (
              <tr key={index} className="border-t border-border">
                <td className="px-3 py-2">{product.name}</td>
                <td className="px-3 py-2">{product.platform}</td>
                <td className="tabular px-3 py-2">{product.price.toLocaleString()}원</td>
                <td className="px-3 py-2">{product.boxType}</td>
                <td className="px-3 py-2">{product.combinationType}</td>
                <td className="px-3 py-2">{product.composition ?? "-"}</td>
                <td className="px-3 py-2">{product.material ?? "-"}</td>
                <td className="tabular px-3 py-2">{product.reviewCount ?? "-"}</td>
                <td className="tabular px-3 py-2">{product.rating ?? "-"}</td>
                <td className="px-3 py-2">
                  {product.url ? (
                    <a href={product.url} target="_blank" rel="noreferrer" className="text-accent underline">
                      링크
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-ink-muted">조건에 맞는 상품이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
