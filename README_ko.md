# EQR NLP

[English README](./README.md)

EQR NLP는 저마찰 뉴스 이벤트를 기반으로 한국 매크로 지표 영향도를 분석하는 Vercel-ready 리서치 데모입니다. 공개 피드 형태의 이벤트를 고정된 한국 매크로 바스켓에 대한 설명 가능한 다중 기간 시나리오 점수로 변환합니다.

## 데모 범위

- 재현 가능한 샘플 데이터 기반 이벤트 피드
- 향후 ECOS/KRX/DART 등 live 데이터 연동을 위한 korea-finance-mcp 어댑터 경계
- 다음 매크로 바스켓 카드:
  - USD/KRW
  - 기준금리 / 정책금리 기대
  - 국고채 금리
  - M2 / 유동성
- 각 지표별 1D, 1W, 1M 전망
- 출처 링크가 있는 근거, 불확실성/제한 사항, 미니 시계열 차트, 브라우저 로컬 분석 메모

## 왜 로컬 fixture부터 시작하나요?

승인된 MVP는 벤치마크 정확도나 가입이 필요한 인프라보다 end-to-end 제품 데모를 우선합니다. 이후 공개 피드와 실제 korea-finance-mcp transport를 샘플 어댑터 대신 연결할 수 있도록 구성했습니다.

## 경계

이 프로젝트는 리서치 데모입니다. 주문 실행, 포트폴리오 관리, 프로덕션 투자자문 워크플로를 제공하지 않습니다. 실제 상용/프로덕션 사용 전 법무·컴플라이언스 검토가 필요합니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Vitest
- ESLint
- 외부 서비스 없이 실행되는 로컬 fixture 어댑터

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 <http://localhost:3000>을 여세요.

## 검증

```bash
npm test
npm run lint
npm run build
```

## 후속 live 연동 후보

- RSS/GDELT 스타일 저마찰 feed 어댑터
- 실제 korea-finance-mcp client transport
- DB 선택 승인 후 메모/분석 결과 저장
- live 이벤트/지표 데이터 확보 후 과거 성능 평가
