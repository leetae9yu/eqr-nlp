import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "EQR NLP | 한국 매크로 예측 리서치",
  description: "DART 공시·뉴스·거시지표를 연결해 근거와 정확도를 함께 보여주는 한국 매크로 예측 리서치 SaaS.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#content">본문으로 이동</a>
        <header className="app-header" aria-label="EQR NLP navigation">
          <nav className="global-nav" aria-label="전역 내비게이션">
            <div className="global-nav-inner">
              <Link className="nav-brand" href="/" aria-label="EQR NLP 홈">
                <span className="nav-mark" aria-hidden="true" />
                EQR NLP
              </Link>
              <div className="nav-links" aria-label="주요 화면">
                <Link href="/dart/forecasts">예측 결과</Link>
                <Link href="/accuracy">정확도</Link>
                <Link href="/graph">지식그래프</Link>
                <Link href="/dart">데이터</Link>
              </div>
              <span className="nav-utility">Analyst landing</span>
            </div>
          </nav>
          <nav className="sub-nav" aria-label="제품 내비게이션">
            <div className="sub-nav-inner">
              <Link className="sub-nav-title" href="/">공시 기반 매크로 리서치</Link>
              <div className="sub-nav-links">
                <Link href="/graph">온톨로지</Link>
                <Link href="/backtests">백테스트</Link>
                <Link className="primary-link" href="/dart/forecasts">결과 보기</Link>
              </div>
            </div>
          </nav>
        </header>
        <div id="content">{children}</div>
        <footer className="app-footer">
          <div className="footer-inner">
            <div>
              <p className="footer-title">EQR NLP</p>
              <p className="muted">DART·ECOS 기반 리서치용 매크로 영향 분석. 매매 신호나 투자 자문이 아닙니다.</p>
            </div>
            <div className="footer-links">
              <Link href="/dart/forecasts">예측 결과</Link>
              <Link href="/accuracy">정확도 검증</Link>
              <Link href="/graph">지식그래프</Link>
              <Link href="/portfolio">포트폴리오</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
