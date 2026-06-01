# EQR NLP

[English README](./README.md)

EQR NLP는 저마찰 뉴스 이벤트, 공시, live-first 매크로 기준값을 바탕으로 한국 매크로 지표 영향도를 분석하는 Vercel-ready 리서치 데모입니다. 소스 문서를 설명 가능한 event-to-macro 지식그래프로 변환하고, magnitude-error 백테스트로 관계 가중치를 보정한 뒤, 고정 한국 매크로 바스켓에 대한 다중 기간 시나리오 전망을 보여줍니다.

## 데모 범위

- 재현 가능한 샘플 데이터 기반 이벤트 피드
- fixture, RSS, GDELT DOC API 스타일, OpenDART 공시 입력을 위한 server-only 소스 어댑터 계약
- live-first 매크로 기준값 어댑터: USD/KRW는 키 없는 Frankfurter daily FX를 사용하고, 기준금리·국고채 3년·M2는 `BOK_ECOS_API_KEY` 또는 `ECOS_API_KEY`가 있으면 ECOS를 사용하며 없으면 명시적 샘플 fallback 표시
- `/accuracy`에서 실제 이력 기반 예측을 naive baseline과 비교하고 PASS / FAIL / INSUFFICIENT_COVERAGE / PENDING 상태로 표시하는 beyond-MVP 정확도 점수표
- Source, Document, Entity, Event, Indicator, Observation, Weight, BacktestRun, Forecast, PortfolioScenario 개념을 가진 메모리 기반 지식그래프
- 다음 매크로 바스켓 카드:
  - USD/KRW
  - 기준금리 / 정책금리 기대
  - 국고채 금리
  - M2 / 유동성
- 각 지표별 1D, 1W, 1M 전망
- DART ontology 구축을 위한 OpenCrab-inspired evidence → claim → promotion lifecycle
- MAE, RMSE, zero-safe sMAPE 기반 백테스트 보정 가중치
- 출처 링크가 있는 근거, KG path 힌트, 불확실성, 미니 시계열 차트, 브라우저 로컬 분석 메모, 가상 포트폴리오 시뮬레이션

## 앱 라우트

- `/` — DART 예측 우선 진입점을 가진 한국어 대시보드와 리서치 경계
- `/events/[id]` — 근거, 불확실성, 보정 정보를 포함한 매크로 바스켓 전망
- `/graph` — `DART_API_KEY`가 있으면 live OpenDART KG provenance, 없으면 fixture fallback
- `/dart` — 서버 렌더링 live OpenDART 공시 목록, KG ingestion 상태, ontology promotion gate, pack export 링크
- `/dart/forecasts` — live OpenDART 공시를 매크로 예측 결과 카드로 변환
- `/accuracy` — 소스 커버리지, hard gate, Balanced target gap, 모델/지표/소스 버전, 비투자자문 문구를 포함한 한국어 정확도 점수표
- `/backtests` — deterministic fixture 보정 run과 생성된 weight
- `/portfolio` — 가상 시나리오 시뮬레이션 전용. 브로커, 주문, 개인화 자문, 추천, buy/sell signal, target price 워크플로는 없음

## 왜 명시적 fallback을 남기나요?

승인된 MVP는 벤치마크 정확도나 가입이 필요한 인프라보다 end-to-end 제품 데모를 우선합니다. 현재 USD/KRW와 DART는 live-first로 동작하고, ECOS 키가 필요한 지표는 키가 없을 때 샘플 fallback을 명시합니다.

## 경계

이 프로젝트는 리서치 데모입니다. 주문 실행, 브로커 연동, 포트폴리오 관리 자동화, 개인화 투자자문, 추천, buy/sell signal, target price를 제공하지 않습니다. 포트폴리오 기능은 가상 시나리오 시뮬레이션과 과거 백테스트로 제한됩니다. 실제 상용/프로덕션 사용 전 법무·컴플라이언스 검토가 필요합니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Vitest
- ESLint
- 외부 서비스 없이 실행되는 로컬 fixture 어댑터
- non-durable KG 데모와 테스트용 `MemoryGraphStore`

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 <http://localhost:3000>을 여세요.

Vercel에는 `DART_API_KEY`를 설정하면 live OpenDART 조회가 켜집니다. USD/KRW는 키 없는 Frankfurter를 사용합니다. 기준금리·국고채 3년·M2는 `BOK_ECOS_API_KEY` 또는 `ECOS_API_KEY`를 설정하면 한국은행 ECOS 기준값으로 전환됩니다. `DATABASE_URL`은 Neon/Vercel Marketplace Postgres에 연결해 운영 정확도 evidence를 저장할 때 사용합니다. 없으면 `/accuracy`는 명시적 비프로덕션 인메모리 저장소를 사용합니다. `CRON_SECRET`은 Vercel Cron이 `/api/accuracy/ingest`를 호출할 때 보호용으로 사용합니다. 키가 없어도 build는 통과하지만 fallback/coverage gap을 명시합니다.

## 검증

```bash
npm test
npm run lint
npm run build
```

## 아키텍처와 provenance

- [Architecture notes](./docs/architecture.md)
- [Fixture provenance](./docs/fixture-provenance.md)
- [Knowledge graph schema](./docs/knowledge-graph-schema.md)
- [Backtesting and weight calibration](./docs/backtesting.md)
- [Beyond-MVP accuracy release plan](./docs/beyond-mvp-accuracy-plan.md)
- [Beyond-MVP accuracy test spec](./docs/beyond-mvp-accuracy-test-spec.md)
- [Cost boundaries](./docs/cost-boundaries.md)
- [Portfolio simulation boundary](./docs/portfolio-simulation-boundary.md)
- [OpenCrab-inspired ontology factory](./docs/opencrab-inspired-ontology.md)

## 후속 live 연동 후보

- 현재 accuracy history cron을 넘어 RSS/GDELT/OpenDART durable scheduled ingestion 확장
- direct live macro adapter를 korea-finance-mcp transport로 교체/확장
- setup 승인 후 `GraphStore` 뒤에 free-tier graph database adapter 추가
- fixture 백테스트 window를 실제 과거 이벤트/지표 데이터로 교체
