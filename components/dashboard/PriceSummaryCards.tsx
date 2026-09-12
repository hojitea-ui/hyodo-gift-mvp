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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
        >
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{card.label}</p>
          <p className="mt-1 text-lg font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
