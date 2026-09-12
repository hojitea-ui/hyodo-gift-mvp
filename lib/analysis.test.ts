import { describe, expect, it } from "vitest";
import {
  getCrossFrequency,
  getFieldFrequency,
  getPriceHistogram,
  getPriceStats,
  getTopCompositionTokens,
} from "./analysis";
import type { Product } from "./schema";

function makeProduct(overrides: Partial<Product>): Product {
  return {
    name: "샘플",
    platform: "네이버",
    price: 10000,
    boxType: "봉투형",
    combinationType: "지압봉",
    ...overrides,
  };
}

describe("getPriceStats", () => {
  it("returns all zeros for an empty list", () => {
    expect(getPriceStats([])).toEqual({ min: 0, max: 0, mean: 0, median: 0 });
  });

  it("computes min/max/mean/median for an odd-length list", () => {
    const products = [10000, 20000, 15000].map((price) => makeProduct({ price }));
    expect(getPriceStats(products)).toEqual({ min: 10000, max: 20000, mean: 15000, median: 15000 });
  });

  it("averages the two middle values for an even-length list", () => {
    const products = [10000, 20000, 15000, 25000].map((price) => makeProduct({ price }));
    expect(getPriceStats(products)).toEqual({ min: 10000, max: 25000, mean: 17500, median: 17500 });
  });
});

describe("getPriceHistogram", () => {
  it("returns an empty array for an empty list", () => {
    expect(getPriceHistogram([])).toEqual([]);
  });

  it("buckets prices using an explicit bucket size", () => {
    const products = [1000, 4000, 7000, 9000].map((price) => makeProduct({ price }));
    const histogram = getPriceHistogram(products, 3000);

    expect(histogram).toHaveLength(3);
    expect(histogram.map((b) => b.count)).toEqual([1, 1, 2]);
    expect(histogram[0].range).toBe("1,000~4,000");
    expect(histogram[2].range).toBe("7,000~10,000");
  });

  it("derives a bucket size that produces roughly 8 buckets when none is given", () => {
    const products = Array.from({ length: 20 }, (_, i) => makeProduct({ price: 1000 + i * 500 }));
    const histogram = getPriceHistogram(products);
    const totalCount = histogram.reduce((sum, b) => sum + b.count, 0);

    expect(histogram.length).toBeLessThanOrEqual(8);
    expect(totalCount).toBe(products.length);
  });
});

describe("getFieldFrequency", () => {
  it("counts values and sorts descending, skipping empty values", () => {
    const products = [
      makeProduct({ boxType: "봉투형" }),
      makeProduct({ boxType: "봉투형" }),
      makeProduct({ boxType: "케이스형" }),
    ];

    expect(getFieldFrequency(products, "boxType")).toEqual([
      { value: "봉투형", count: 2 },
      { value: "케이스형", count: 1 },
    ]);
    expect(getFieldFrequency(products, "size")).toEqual([]);
  });
});

describe("getCrossFrequency", () => {
  it("counts boxType x combinationType combinations", () => {
    const products = [
      makeProduct({ boxType: "봉투형", combinationType: "지압봉" }),
      makeProduct({ boxType: "봉투형", combinationType: "지압봉" }),
      makeProduct({ boxType: "케이스형", combinationType: "화장품" }),
    ];

    expect(getCrossFrequency(products)).toEqual([
      { boxType: "봉투형", combinationType: "지압봉", count: 2 },
      { boxType: "케이스형", combinationType: "화장품", count: 1 },
    ]);
  });
});

describe("getTopCompositionTokens", () => {
  it("tokenizes on +, comma and slash, dedupes per product, and computes ratio", () => {
    const products = [
      makeProduct({ composition: "용돈박스 + 지압봉 + 파우치" }),
      makeProduct({ composition: "용돈박스+지압봉" }),
      makeProduct({ composition: "화장품 세트" }),
    ];

    const tokens = getTopCompositionTokens(products, 2);

    expect(tokens).toEqual([
      { token: "용돈박스", count: 2, ratio: 2 / 3 },
      { token: "지압봉", count: 2, ratio: 2 / 3 },
    ]);
  });

  it("returns an empty array when no product has a composition", () => {
    expect(getTopCompositionTokens([makeProduct({})])).toEqual([]);
  });
});
