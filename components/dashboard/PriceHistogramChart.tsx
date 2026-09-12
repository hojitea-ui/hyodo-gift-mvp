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
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 font-display text-base text-ink">가격 구간별 상품 수</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="2 3" stroke="var(--border)" />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
              stroke="var(--border)"
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--ink-muted)" }} stroke="var(--border)" />
            <Tooltip
              formatter={(value) => [`${value}건`, "상품 수"]}
              labelFormatter={(label) => `${label}원`}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
            />
            <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
