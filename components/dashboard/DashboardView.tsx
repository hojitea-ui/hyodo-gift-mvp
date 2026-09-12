import PriceSummaryCards from "@/components/dashboard/PriceSummaryCards";
import PriceHistogramChart from "@/components/dashboard/PriceHistogramChart";
import CompositionInsights from "@/components/dashboard/CompositionInsights";
import ProductTable from "@/components/dashboard/ProductTable";
import type { Product } from "@/lib/schema";

interface DashboardViewProps {
  products: Product[];
}

export default function DashboardView({ products }: DashboardViewProps) {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-8">
      <PriceSummaryCards products={products} />
      <PriceHistogramChart products={products} />
      <CompositionInsights products={products} />
      <ProductTable products={products} />
    </div>
  );
}
