import Papa from "papaparse";
import * as XLSX from "xlsx";
import { HEADER_TO_FIELD, NUMERIC_FIELDS, ProductSchema, type Product } from "./schema";

const REQUIRED_TEXT_FIELDS: (keyof Product)[] = [
  "name",
  "platform",
  "boxType",
  "combinationType",
];

const FIELD_TO_HEADER = Object.fromEntries(
  Object.entries(HEADER_TO_FIELD).map(([header, field]) => [field, header])
) as Record<keyof Product, string>;

export interface ParseError {
  row: number;
  reason: string;
}

export interface ParseResult {
  products: Product[];
  errors: ParseError[];
}

type RawRow = Record<string, unknown>;

function cleanNumeric(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[,원\s]/g, "");
  if (cleaned === "") return undefined;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function cleanText(value: unknown): string | undefined {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

async function parseCSV(file: File): Promise<RawRow[]> {
  const text = await file.text();
  const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
  return result.data;
}

async function parseXLSX(file: File): Promise<RawRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: true });
}

function mapRow(rawRow: RawRow): RawRow {
  const mapped: RawRow = {};
  for (const [header, value] of Object.entries(rawRow)) {
    const field = HEADER_TO_FIELD[header.trim()];
    if (field) mapped[field] = value;
  }
  return mapped;
}

function buildProduct(mappedRow: RawRow, rowNumber: number): Product | ParseError {
  const candidate: Record<string, unknown> = {};

  for (const field of REQUIRED_TEXT_FIELDS) {
    const text = cleanText(mappedRow[field]);
    if (text === undefined) {
      return { row: rowNumber, reason: `필수 항목 "${FIELD_TO_HEADER[field]}" 누락` };
    }
    candidate[field] = text;
  }

  for (const field of ["composition", "size", "url", "memo"] as const) {
    const text = cleanText(mappedRow[field]);
    if (text !== undefined) candidate[field] = text;
  }

  for (const field of NUMERIC_FIELDS) {
    const num = cleanNumeric(mappedRow[field]);
    if (field === "price" && num === undefined) {
      return { row: rowNumber, reason: `"가격"을 숫자로 해석할 수 없음: ${String(mappedRow.price ?? "")}` };
    }
    if (num !== undefined) candidate[field] = num;
  }

  const parsed = ProductSchema.safeParse(candidate);
  if (!parsed.success) {
    return { row: rowNumber, reason: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  return parsed.data;
}

export async function parseFile(file: File): Promise<ParseResult> {
  const isCSV = file.name.toLowerCase().endsWith(".csv");
  const isExcel = /\.(xlsx|xls)$/i.test(file.name);

  if (!isCSV && !isExcel) {
    return { products: [], errors: [{ row: 0, reason: "지원하지 않는 파일 형식입니다 (.csv, .xlsx, .xls만 가능)" }] };
  }

  const rawRows = isCSV ? await parseCSV(file) : await parseXLSX(file);

  const products: Product[] = [];
  const errors: ParseError[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // 헤더가 1행이므로 데이터는 2행부터
    const mappedRow = mapRow(rawRow);
    const result = buildProduct(mappedRow, rowNumber);
    if ("row" in result) {
      errors.push(result);
    } else {
      products.push(result);
    }
  });

  return { products, errors };
}
