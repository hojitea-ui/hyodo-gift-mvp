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
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragging ? "border-accent bg-accent-soft" : "border-border bg-surface"
        }`}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleInputChange}
        />
        <span className="font-display text-lg text-ink">파일을 드래그하거나 클릭해서 선택하세요</span>
        <span className="text-sm text-ink-muted">.csv, .xlsx, .xls 지원</span>
        {fileName && <span className="text-sm text-ink">선택한 파일: {fileName}</span>}
      </label>

      {isParsing && <p className="text-sm text-ink-muted">파싱 중...</p>}

      {failureMessage && (
        <p className="rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
          {failureMessage}
        </p>
      )}

      {parseResult && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-ink">
            정상 <strong className="tabular text-accent">{validProducts.length}</strong>행 / 오류{" "}
            <strong className="tabular text-danger">{errors.length}</strong>행
          </p>

          {validProducts.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-surface">
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
                    <tr key={index} className="border-t border-border">
                      <td className="px-3 py-2">{product.name}</td>
                      <td className="px-3 py-2">{product.platform}</td>
                      <td className="tabular px-3 py-2">{product.price.toLocaleString()}원</td>
                      <td className="px-3 py-2">{product.boxType}</td>
                      <td className="px-3 py-2">{product.combinationType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validProducts.length > PREVIEW_LIMIT && (
                <p className="px-3 py-2 text-xs text-ink-muted">
                  외 {validProducts.length - PREVIEW_LIMIT}건 더 (전체는 대시보드에서 확인)
                </p>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm">
              <p className="mb-2 font-medium text-danger">오류 행</p>
              <ul className="flex flex-col gap-1 text-ink">
                {errors.slice(0, PREVIEW_LIMIT).map((error, index) => (
                  <li key={index}>
                    {error.row}행: {error.reason}
                  </li>
                ))}
              </ul>
              {errors.length > PREVIEW_LIMIT && (
                <p className="mt-2 text-xs text-danger">외 {errors.length - PREVIEW_LIMIT}건 더</p>
              )}
            </div>
          )}

          {hasExistingData && (
            <fieldset className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-sm">
              <legend className="mb-1 px-1 font-medium text-ink">기존 데이터 처리</legend>
              <label className="flex items-center gap-2 text-ink">
                <input
                  type="radio"
                  name="upload-mode"
                  checked={mode === "overwrite"}
                  onChange={() => setMode("overwrite")}
                />
                덮어쓰기 (기존 데이터를 이번 업로드로 교체)
              </label>
              <label className="flex items-center gap-2 text-ink">
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
            className="w-fit rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            대시보드 보기
          </button>
        </div>
      )}
    </div>
  );
}
