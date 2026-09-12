import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "용돈박스+결합상품 경쟁 분석",
  description: "용돈박스+결합상품 경쟁 상품 분석 대시보드",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout applies to every route; next/font/google has no "korean" subset for these families. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@700;800&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
