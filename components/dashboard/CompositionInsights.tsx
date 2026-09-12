import {
  getCrossFrequency,
  getFieldFrequency,
  getTopCompositionTokens,
  type FieldFrequency,
} from "@/lib/analysis";
import type { Product } from "@/lib/schema";

interface CompositionInsightsProps {
  products: Product[];
}

function FrequencyList({ title, items }: { title: string; items: FieldFrequency[] }) {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-3 font-display text-base text-ink">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">데이터 없음</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.value} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 truncate">{item.value}</span>
              <div className="h-2 flex-1 rounded-full bg-accent-soft">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
              <span className="tabular w-10 shrink-0 text-right text-ink-muted">{item.count}건</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CompositionInsights({ products }: CompositionInsightsProps) {
  const boxTypeFrequency = getFieldFrequency(products, "boxType");
  const combinationTypeFrequency = getFieldFrequency(products, "combinationType");
  const crossFrequency = getCrossFrequency(products);
  const compositionTokens = getTopCompositionTokens(products);

  const boxTypeOrder = boxTypeFrequency.map((item) => item.value);
  const combinationTypeOrder = combinationTypeFrequency.map((item) => item.value);
  const crossLookup = new Map(crossFrequency.map((c) => [`${c.boxType}||${c.combinationType}`, c.count]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FrequencyList title="용돈박스형태 분포" items={boxTypeFrequency} />
        <FrequencyList title="결합상품유형 분포" items={combinationTypeFrequency} />
      </div>

      {boxTypeOrder.length > 0 && combinationTypeOrder.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 font-display text-base text-ink">용돈박스형태 × 결합상품유형 교차표</h3>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="whitespace-nowrap px-3 py-2 font-medium text-ink-muted">형태 \ 유형</th>
                {combinationTypeOrder.map((combinationType) => (
                  <th key={combinationType} className="whitespace-nowrap px-3 py-2 font-medium text-ink-muted">
                    {combinationType}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {boxTypeOrder.map((boxType) => (
                <tr key={boxType} className="border-t border-border">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-ink">{boxType}</td>
                  {combinationTypeOrder.map((combinationType) => (
                    <td key={combinationType} className="tabular whitespace-nowrap px-3 py-2 text-ink-muted">
                      {crossLookup.get(`${boxType}||${combinationType}`) ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 font-display text-base text-ink">구성 토큰 랭킹</h3>
        {compositionTokens.length === 0 ? (
          <p className="text-sm text-ink-muted">구성 정보가 있는 상품이 없음</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {compositionTokens.map((token) => (
              <li key={token.token} className="flex items-center justify-between text-sm">
                <span className="truncate">{token.token}</span>
                <span className="tabular text-ink-muted">
                  {token.count}건 ({Math.round(token.ratio * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
