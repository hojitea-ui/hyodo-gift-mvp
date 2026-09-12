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
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">데이터 없음</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.value} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 truncate">{item.value}</span>
              <div className="h-2 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-zinc-500"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-zinc-500">{item.count}건</span>
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
        <div className="overflow-x-auto rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            용돈박스형태 × 결합상품유형 교차표
          </h3>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-500">형태 \ 유형</th>
                {combinationTypeOrder.map((combinationType) => (
                  <th key={combinationType} className="px-3 py-2 font-medium text-zinc-500">
                    {combinationType}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {boxTypeOrder.map((boxType) => (
                <tr key={boxType} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-3 py-2 font-medium">{boxType}</td>
                  {combinationTypeOrder.map((combinationType) => (
                    <td key={combinationType} className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {crossLookup.get(`${boxType}||${combinationType}`) ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">구성 토큰 랭킹</h3>
        {compositionTokens.length === 0 ? (
          <p className="text-sm text-zinc-500">구성 정보가 있는 상품이 없음</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {compositionTokens.map((token) => (
              <li key={token.token} className="flex items-center justify-between text-sm">
                <span className="truncate">{token.token}</span>
                <span className="text-zinc-500">
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
