"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getPriceHistogram } from "@/lib/analysis";
import type { Product } from "@/lib/schema";

interface PriceHistogramChartProps {
  products: Product[];
}

export default function PriceHistogramChart({ products }: PriceHistogramChartProps) {
  const histogram = getPriceHistogram(products);

  if (histogram.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">가격 구간별 상품 수</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
            <XAxis dataKey="range" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [`${value}건`, "상품 수"]} labelFormatter={(label) => `${label}원`} />
            <Bar dataKey="count" fill="#3f3f46" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
