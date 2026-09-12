import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseFile } from "./parseFile";

function loadSampleFile(): File {
  const filePath = resolve(__dirname, "../sample-data/competitors-sample.csv");
  const buffer = readFileSync(filePath);
  return new File([buffer], "competitors-sample.csv", { type: "text/csv" });
}

describe("parseFile", () => {
  it("parses valid rows and separates error rows from the sample CSV", async () => {
    const { products, errors } = await parseFile(loadSampleFile());

    expect(products).toHaveLength(3);
    expect(errors).toHaveLength(2);

    const [first, second, third] = products;
    expect(first).toMatchObject({
      name: "프리미엄 용돈박스+옥지압봉",
      platform: "네이버",
      price: 15000,
      boxType: "봉투형",
      combinationType: "지압봉",
      reviewCount: 120,
      rating: 4.5,
    });
    expect(second.reviewCount).toBe(45);
    expect(third.rating).toBeUndefined();

    expect(errors[0].row).toBe(5);
    expect(errors[0].reason).toContain("가격");
    expect(errors[1].row).toBe(6);
    expect(errors[1].reason).toContain("결합상품유형");
  });

  it("rejects unsupported file extensions", async () => {
    const file = new File(["not a real file"], "notes.txt", { type: "text/plain" });
    const { products, errors } = await parseFile(file);
    expect(products).toHaveLength(0);
    expect(errors[0].reason).toContain("지원하지 않는 파일 형식");
  });
});
