"use client";

import { useState } from "react";
import { parseFile, type ParseResult } from "@/lib/parseFile";
import type { Product } from "@/lib/schema";

const PREVIEW_LIMIT = 20;

interface UploadPanelProps {
  hasExistingData: boolean;
  onConfirm: (products: Product[], mode: "overwrite" | "append") => void;
}

export default function UploadPanel({ hasExistingData, onConfirm }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"overwrite" | "append">("overwrite");

  async function handleFile(file: File) {
    setIsParsing(true);
    setFailureMessage(null);
    setParseResult(null);
    setFileName(file.name);
    try {
      const result = await parseFile(file);
      setParseResult(result);
    } catch (error) {
      setFailureMessage(error instanceof Error ? error.message : "파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setIsParsing(false);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const validProducts = parseResult?.products ?? [];
  const errors = parseResult?.errors ?? [];

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragging
            ? "border-zinc-950 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-900"
            : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleInputChange}
        />
        <span className="font-medium">파일을 드래그하거나 클릭해서 선택하세요</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">.csv, .xlsx, .xls 지원</span>
        {fileName && <span className="text-sm text-zinc-600 dark:text-zinc-300">선택한 파일: {fileName}</span>}
      </label>

      {isParsing && <p className="text-sm text-zinc-500">파싱 중...</p>}

      {failureMessage && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {failureMessage}
        </p>
      )}

      {parseResult && (
        <div className="flex flex-col gap-6">
          <p className="text-sm">
            정상 <strong>{validProducts.length}</strong>행 / 오류 <strong>{errors.length}</strong>행
          </p>

          {validProducts.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-3 py-2 font-medium">상품명</th>
                    <th className="px-3 py-2 font-medium">판매처</th>
                    <th className="px-3 py-2 font-medium">가격</th>
                    <th className="px-3 py-2 font-medium">용돈박스형태</th>
                    <th className="px-3 py-2 font-medium">결합상품유형</th>
                  </tr>
                </thead>
                <tbody>
                  {validProducts.slice(0, PREVIEW_LIMIT).map((product, index) => (
                    <tr key={index} className="border-t border-zinc-200 dark:border-zinc-800">
                      <td className="px-3 py-2">{product.name}</td>
                      <td className="px-3 py-2">{product.platform}</td>
                      <td className="px-3 py-2">{product.price.toLocaleString()}원</td>
                      <td className="px-3 py-2">{product.boxType}</td>
                      <td className="px-3 py-2">{product.combinationType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validProducts.length > PREVIEW_LIMIT && (
                <p className="px-3 py-2 text-xs text-zinc-500">
                  외 {validProducts.length - PREVIEW_LIMIT}건 더 (전체는 대시보드에서 확인)
                </p>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
              <p className="mb-2 font-medium text-amber-800 dark:text-amber-300">오류 행</p>
              <ul className="flex flex-col gap-1 text-amber-700 dark:text-amber-400">
                {errors.slice(0, PREVIEW_LIMIT).map((error, index) => (
                  <li key={index}>
                    {error.row}행: {error.reason}
                  </li>
                ))}
              </ul>
              {errors.length > PREVIEW_LIMIT && (
                <p className="mt-2 text-xs text-amber-600">외 {errors.length - PREVIEW_LIMIT}건 더</p>
              )}
            </div>
          )}

          {hasExistingData && (
            <fieldset className="flex flex-col gap-2 text-sm">
              <legend className="mb-1 font-medium">기존 데이터 처리</legend>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="upload-mode"
                  checked={mode === "overwrite"}
                  onChange={() => setMode("overwrite")}
                />
                덮어쓰기 (기존 데이터를 이번 업로드로 교체)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="upload-mode"
                  checked={mode === "append"}
                  onChange={() => setMode("append")}
                />
                추가하기 (기존 데이터 뒤에 이어붙임)
              </label>
            </fieldset>
          )}

          <button
            type="button"
            disabled={validProducts.length === 0}
            onClick={() => onConfirm(validProducts, mode)}
            className="w-fit rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc]"
          >
            대시보드 보기
          </button>
        </div>
      )}
    </div>
  );
}
