import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1),
  platform: z.string().min(1),
  price: z.number().positive(),
  boxType: z.string().min(1),
  combinationType: z.string().min(1),
  composition: z.string().optional(),
  material: z.string().optional(),
  size: z.string().optional(),
  reviewCount: z.number().optional(),
  rating: z.number().optional(),
  url: z.string().optional(),
  memo: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const HEADER_TO_FIELD: Record<string, keyof Product> = {
  "상품명": "name",
  "판매처": "platform",
  "가격": "price",
  "용돈박스형태": "boxType",
  "결합상품유형": "combinationType",
  "구성": "composition",
  "재질": "material",
  "사이즈": "size",
  "리뷰수": "reviewCount",
  "평점": "rating",
  "URL": "url",
  "비고": "memo",
};

export const NUMERIC_FIELDS: (keyof Product)[] = ["price", "reviewCount", "rating"];
