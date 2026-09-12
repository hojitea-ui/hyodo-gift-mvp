import { getPriceStats } from "@/lib/analysis";
import type { Product } from "@/lib/schema";

interface PriceSummaryCardsProps {
  products: Product[];
}

export default function PriceSummaryCards({ products }: PriceSummaryCardsProps) {
  const { min, max, mean, median } = getPriceStats(products);

  const cards = [
    { label: "상품 수", value: `${products.length}건` },
    { label: "최저가", value: `${min.toLocaleString()}원` },
    { label: "최고가", value: `${max.toLocaleString()}원` },
    { label: "평균가", value: `${Math.round(mean).toLocaleString()}원` },
    { label: "중앙값", value: `${median.toLocaleString()}원` },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="bg-surface px-5 py-4">
          <p className="text-xs text-ink-muted">{card.label}</p>
          <p className="tabular mt-1 text-xl font-semibold text-accent">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
