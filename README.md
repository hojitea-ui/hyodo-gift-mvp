# 용돈박스+결합상품 경쟁 상품 분석 대시보드

용돈박스(부모님께 용돈을 담아 드리는 케이스/봉투형 상품)에 실제로 어떤 상품이 결합되어 팔리는지, 조사한 데이터를 CSV/엑셀로 업로드하면 가격대·구성 공통점·상품 비교를 자동으로 뽑아주는 1인용 로컬 대시보드입니다.

## 배경

1688에서 옥(玉) 지압봉을 소싱해 용돈박스와 묶어 "효도 선물"로 재판매하는 사업을 구상하던 중, 우리 상품의 결합 대상을 지압봉으로 확정 짓기 전에 시장에서 용돈박스가 실제로 어떤 상품들과 결합되어 팔리는지부터 데이터로 파악하기 위해 만든 조사 도구입니다.

조사 범위는 두 번 넓어졌습니다.

1. **옥 지압봉 단독** — 검색량이 적고 "괄사"라는 더 넓은 카테고리에 묻혀 독립된 비교가 어려움을 확인
2. **용돈박스+옥지압봉** — 그래도 결합 대상을 지압봉으로 한정하면 시장 파악이 너무 좁음을 재확인
3. **용돈박스+결합상품** (현재 범위) — 결합 대상을 지압봉으로 한정하지 않고, 용돈박스에 결합되는 상품 전체(화장품, 건강식품, 생활용품 등)를 조사 대상으로 넓힘. 용돈박스 단독 상품(결합 없음)은 조사 대상에서 제외.

자세한 배경과 요구사항은 [docs/PRD.md](./docs/PRD.md), 구현 설계는 [docs/TECH_SPEC.md](./docs/TECH_SPEC.md)에 정리되어 있습니다. 실제 조사 데이터(20건)를 이 대시보드로 분석한 결과와 결론은 [docs/CONCLUSION.md](./docs/CONCLUSION.md)를 참고하세요.

과제 제출용 자료(기획 문서 1장 / 회고록 / 도메인 연결 문장)는 [docs/ONE_PAGER.md](./docs/ONE_PAGER.md)와 [docs/RETROSPECTIVE.md](./docs/RETROSPECTIVE.md)에, 제출물·루브릭 대조표는 [docs/SUBMISSION.md](./docs/SUBMISSION.md)에 정리해뒀습니다.

## 주요 기능

- **파일 업로드**: CSV/XLSX 파일을 드래그하거나 선택해서 업로드 (`papaparse`, `xlsx`)
- **데이터 검증**: 필수 컬럼 누락, 가격 파싱 실패 등은 오류 행으로 분리해 안내하고 나머지 정상 행만 반영 (부분 성공 허용)
- **가격대 분석**: 최저/최고/평균/중앙값 요약 카드 + 구간별 히스토그램
- **구성 공통점 분석**: 용돈박스형태·결합상품유형 빈도, 교차표, 구성 토큰(부가 구성품) 랭킹
- **상품 비교 테이블**: 판매처/용돈박스형태/결합상품유형/가격 범위로 필터링
- **데이터 유지**: `localStorage`에 저장되어 새로고침해도 유지되며, 새 파일 업로드나 초기화 가능

## 실행 방법

Node.js 20 이상을 권장합니다.

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속. 환경변수나 외부 서비스 키는 필요 없습니다.

## 샘플 데이터로 바로 확인하기

[sample-data/competitors-sample.csv](./sample-data/competitors-sample.csv)에 예시 데이터가 포함되어 있습니다. 업로드 화면에서 이 파일을 선택하면 바로 대시보드 동작을 확인할 수 있습니다.

샘플에는 정상 행뿐 아니라 일부러 넣은 오류 행도 있습니다.

- 가격 파싱 실패 예시 (`가격` 컬럼에 "1~2만원"처럼 숫자로 변환할 수 없는 값)
- 필수 항목 누락 예시 (`결합상품유형`이 비어 있는 행)

업로드 시 이 두 행은 정상 행과 분리되어 "몇 번째 행, 어떤 이유"로 안내됩니다.

## 화면 구성

1. **업로드 화면** (`localStorage`에 데이터가 없을 때): 파일 드래그/선택 → 파싱 → 정상 행/오류 행 미리보기
2. **대시보드 화면** (데이터가 있을 때):
   - 상단: 가격 요약 카드(최저/최고/평균/중앙값, 상품 수) + "새 파일 업로드" / "데이터 초기화" 버튼
   - 가격 구간별 히스토그램
   - 용돈박스형태·결합상품유형 빈도, 교차표, 구성 토큰 랭킹
   - 하단: 전체 상품 비교 테이블 (정렬/필터)

**업로드 화면** (실제 조사 데이터 20행, 정상 20행/오류 0행)

![업로드 화면](./docs/screenshots/upload.png?v=576642c)

**대시보드 화면** (가격 요약 카드 + 히스토그램 + 분포/교차표)

![대시보드 화면](./docs/screenshots/dashboard.png?v=576642c)

## 폴더 구조 및 핵심 로직

```
app/
  page.tsx                     # localStorage 데이터 유무에 따라 업로드 화면 / 대시보드 분기
components/
  UploadPanel.tsx              # 파일 선택, 파싱, 미리보기, 오류행 안내
  dashboard/
    DashboardView.tsx          # 요약 카드 + 차트 + 테이블 컨테이너
    PriceSummaryCards.tsx
    PriceHistogramChart.tsx
    CompositionInsights.tsx    # 용돈박스형태·결합상품유형 빈도 + 교차표 + 구성 토큰 랭킹
    ProductTable.tsx
lib/
  schema.ts                    # zod 스키마 — 업로드 데이터의 필수 컬럼/타입 검증
  parseFile.ts                 # CSV/XLSX -> Product[] (+ 오류 리스트), 한글 헤더 매핑
  analysis.ts                  # 가격 통계/히스토그램/빈도/교차표/구성 토큰 — 순수 함수
  storage.ts                   # localStorage read/write 래퍼
sample-data/
  competitors-sample.csv       # 업로드 테스트용 샘플 (정상 행 + 오류 행 포함)
docs/
  PRD.md                       # 제품 요구사항 정의서
  TECH_SPEC.md                 # 기술 명세서 (아키텍처, 데이터 모델, 화면 구성 등)
```

코드 리뷰 시 [lib/analysis.ts](./lib/analysis.ts)(분석 로직)와 [lib/parseFile.ts](./lib/parseFile.ts)(파싱/오류 처리)를 먼저 보는 것을 추천합니다. 두 파일 모두 순수 함수 위주라 [lib/analysis.test.ts](./lib/analysis.test.ts), [lib/parseFile.test.ts](./lib/parseFile.test.ts)와 나란히 보면 동작을 빠르게 파악할 수 있습니다.

## 테스트

```bash
npm run test    # vitest (lib/*.test.ts)
npm run lint
npx tsc --noEmit
```

## 기술 스택

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 · `papaparse` (CSV) · `xlsx`(SheetJS CDN 패치 빌드, 취약점이 있는 npm 레지스트리 버전 대신 사용) · `zod` (스키마 검증) · `recharts` (차트) · `localStorage` (저장, 서버 없음)

## Out of Scope

회원가입/로그인, URL 자동 크롤링, 서버 DB, 다중 사용자, 원가·마진 시뮬레이션은 이번 MVP 범위 밖입니다. 자세한 이유와 향후 확장 계획은 [docs/TECH_SPEC.md](./docs/TECH_SPEC.md) 10절을 참고하세요.
