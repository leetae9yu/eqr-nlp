import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EQR NLP 매크로 예측 대시보드",
  description: "DART 공시와 저마찰 뉴스 이벤트 기반 한국 매크로 영향 예측 리서치 대시보드.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
